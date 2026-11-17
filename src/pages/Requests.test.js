import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Requests from './Requests';
import requestService from '../services/requestService';
import { TableSearchProvider, useTableSearch } from '../context/TableSearchContext';

jest.mock('../services/requestService', () => ({ __esModule: true, default: {
    getRequests: jest.fn(), getPost: jest.fn(), deletePost: jest.fn(),
} }));
jest.mock('@mantine/notifications', () => ({ notifications: { show: jest.fn() } }));
jest.mock('../context/MetadataContext', () => ({ useMetadata: () => ({
    getTranslation: (type, id) => `${type} ${id}`,
}) }));
jest.mock('../components/GenericTable', () => {
    const actual = jest.requireActual('../components/GenericTable');
    const React = require('react');
    return { ...actual, useTablePagination: () => {
        const [page, setPage] = React.useState(1);
        return { page, setPage, take: 10, skip: (page - 1) * 10, containerRef: () => {}, ready: true };
    } };
});

const post = {
    id: 12, userId: 8, statusId: 2, urgencyLevelId: 1, categoryId: 3,
    groupId: 4, locationId: 1, contactTypeId: 1, contactName: 'Contact', contactPhone: '0500000000',
    content: 'Need medicine', duration: 60, distance: 0, expirationTime: '2026-11-01T00:00:00Z',
    isPublic: true, isActive: false, creationTime: '2026-10-01T00:00:00Z',
    updateTime: '2026-10-02T00:00:00Z', distanceFromLocation: null,
    place: { city: { names: [{ languageId: 1, name: 'חיפה' }] },
        location: { latitude: 32.8, longitude: 35.0, names: [{ languageId: 1, name: 'Central' }] } },
    images: [{ id: 1, name: 'photo', url: 'https://example.invalid/post-photo.jpg' }],
    group: { id: 4, name: 'Helpers', imageUrl: null },
    user: { id: 8, name: 'Nora', phone: '0501234567' },
};
const list = (items = [post], total = items.length) => ({ isSuccessful: true, data: { items, total } });

beforeAll(() => { Element.prototype.scrollIntoView = jest.fn(); });

function SearchControl() {
    const search = useTableSearch();
    return <input aria-label="Search posts" value={search.searchTerm}
        onChange={event => search.setSearchTerm(event.target.value)} />;
}

function renderRequests() {
    return render(<MantineProvider><TableSearchProvider><SearchControl /><Requests /></TableSearchProvider></MantineProvider>);
}

beforeEach(() => {
    jest.clearAllMocks();
    requestService.getRequests.mockResolvedValue(list());
    requestService.getPost.mockResolvedValue(post);
    requestService.deletePost.mockResolvedValue(undefined);
});

test('shows inactive posts with Delete available, Close disabled, pagination, and search', async () => {
    requestService.getRequests.mockResolvedValue(list([post], 25));
    renderRequests();
    expect(await screen.findByText('Need medicine')).toBeInTheDocument();
    expect(screen.getByText('Nora')).toBeInTheDocument();
    expect(screen.getByText('Helpers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close request unavailable' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete post #12' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Delete post #12?');
    expect(screen.queryByText('Request #12')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(requestService.deletePost).not.toHaveBeenCalled();
    expect(requestService.getRequests).toHaveBeenCalledWith(expect.objectContaining({ take: 10, skip: 0 }));

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(requestService.getRequests).toHaveBeenCalledWith(expect.objectContaining({ skip: 10 })));
    fireEvent.change(screen.getByLabelText('Search posts'), { target: { value: 'medicine' } });
    await waitFor(() => expect(requestService.getRequests).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0, Filter: { Search: { SearchTerm: 'medicine' } },
    })), { timeout: 2000 });
});

test('confirmed deletion runs once, shows success, and reloads the list', async () => {
    let finishDelete;
    requestService.deletePost.mockReturnValue(new Promise(resolve => { finishDelete = resolve; }));
    requestService.getRequests.mockResolvedValueOnce(list()).mockResolvedValueOnce(list([], 0));
    renderRequests();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete post #12' }));
    const confirm = await screen.findByRole('button', { name: 'Confirm delete post' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(requestService.deletePost).toHaveBeenCalledTimes(1);
    expect(requestService.deletePost).toHaveBeenCalledWith(12);
    expect(confirm).toBeDisabled();

    await act(async () => { finishDelete(); });
    expect(await screen.findByText('No requests found.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'Post deleted', color: 'green' }));
    expect(requestService.getPost).not.toHaveBeenCalled();
});

test('deletion failure leaves the confirmation open and allows retry', async () => {
    requestService.deletePost.mockRejectedValueOnce(new Error('API did not confirm deletion'));
    renderRequests();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete post #12' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm delete post' }));
    expect(await screen.findByText('API did not confirm deletion')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Need medicine')).toHaveLength(2);
    expect(notifications.show).not.toHaveBeenCalled();

    requestService.getRequests.mockResolvedValueOnce(list([], 0));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete post' }));
    expect(await screen.findByText('No requests found.')).toBeInTheDocument();
    expect(requestService.deletePost).toHaveBeenCalledTimes(2);
});

test('deleting the only post on a later page returns to the previous page', async () => {
    requestService.getRequests.mockResolvedValue(list([post], 11));
    renderRequests();
    fireEvent.click(await screen.findByRole('button', { name: '2' }));
    await waitFor(() => expect(requestService.getRequests).toHaveBeenCalledWith(expect.objectContaining({ skip: 10 })));
    requestService.getRequests.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Delete post #12' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm delete post' }));
    await waitFor(() => expect(requestService.getRequests).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 })));
});

test('fetches full details, publisher, group, and image on expansion', async () => {
    renderRequests();
    fireEvent.click(await screen.findByText('Need medicine'));
    expect(await screen.findByText('Request #12')).toBeInTheDocument();
    expect(requestService.getPost).toHaveBeenCalledWith(12);
    expect(screen.getByText('0501234567')).toBeInTheDocument();
    expect(screen.getAllByText('Helpers').length).toBeGreaterThan(1);
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Post 12 image 1' })).toHaveAttribute('src', post.images[0].url);
});

test('detail failure offers retry and missing linked entities have clear fallbacks', async () => {
    requestService.getPost.mockRejectedValueOnce(new Error('Detail unavailable'))
        .mockResolvedValueOnce({ ...post, groupId: null, group: null, user: null, images: [] });
    renderRequests();
    fireEvent.click(await screen.findByText('Need medicine'));
    expect(await screen.findByText('Detail unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry details' }));
    expect(await screen.findByText('Request #12')).toBeInTheDocument();
    expect(screen.getByText('No group')).toBeInTheDocument();
    expect(screen.getByText('#8')).toBeInTheDocument();
    expect(requestService.getPost).toHaveBeenCalledTimes(2);
});

test('list failure is an error with retry, not an empty result', async () => {
    requestService.getRequests.mockRejectedValueOnce(new Error('List unavailable')).mockResolvedValueOnce(list());
    renderRequests();
    expect(await screen.findByText('List unavailable')).toBeInTheDocument();
    expect(screen.queryByText('No requests found.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Need medicine')).toBeInTheDocument();
});
