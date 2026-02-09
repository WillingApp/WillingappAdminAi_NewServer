import { request } from './apiClient';
import { ApiResponse } from './apiTypes';

export interface FAQItem {
    id: number;
    question: string;
    answer: string;
    displayOrder: number;
    languageId: number;
}

export interface TermsLinks {
    he: string;
    en: string;
}

export interface ContentPageResponse extends ApiResponse<{
    items: FAQItem[];
}> { }

const contentService = {
    /**
     * Fetch FAQ content based on language
     */
    async getFAQContent(languageId: number): Promise<FAQItem[]> {
        try {
            console.log(`[ContentService] Fetching FAQ for language ${languageId}...`);
            const response = await request<any>(
                `/General/ContentPage?pageType=faq&languageId=${languageId}`
            );

            console.log('[ContentService] Raw API Response:', response);

            let itemsToReturn: any[] = [];

            // 1. Check for standard project wrapper: { data: { items: [...] } }
            if (response?.data?.items && Array.isArray(response.data.items)) {
                itemsToReturn = response.data.items;
            }
            // 2. Check if data itself is the array: { data: [...] }
            else if (response?.data && Array.isArray(response.data)) {
                itemsToReturn = response.data;
            }
            // 3. Check for direct items array: { items: [...] }
            else if (response?.items && Array.isArray(response.items)) {
                itemsToReturn = response.items;
            }
            // 4. Check if the entire response is an array: [...]
            else if (Array.isArray(response)) {
                itemsToReturn = response;
            }

            // Normalize keys (handle PascalCase vs camelCase common in .NET)
            // Added even more variants based on common CMS patterns
            const normalizedItems = itemsToReturn.map((item: any) => ({
                id: item.id ?? item.Id ?? item.ID ?? 0,
                question: item.question ?? item.Question ?? item.title ?? item.Title ?? '',
                answer: item.answer ?? item.Answer ?? item.body ?? item.Body ?? item.content ?? item.Content ?? item.description ?? item.Description ?? '',
                displayOrder: item.displayOrder ?? item.DisplayOrder ?? item.order ?? item.Order ?? 0,
                languageId: item.languageId ?? item.LanguageId ?? languageId,
            }));

            if (normalizedItems.length === 0 && itemsToReturn.length > 0) {
                console.warn('[ContentService] Warning: Raw items found but normalization failed to find required fields.', itemsToReturn[0]);
            } else {
                console.log(`[ContentService] Returning ${normalizedItems.length} normalized items`);
            }

            return normalizedItems;
        } catch (error) {
            console.error('[ContentService] Error fetching FAQ content:', error);
            return [];
        }
    },

    /**
     * MOCK: Create a new FAQ item
     */
    async createFAQ(item: Omit<FAQItem, 'id'>): Promise<FAQItem> {
        console.log('Mocking API: createFAQ', item);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ...item,
                    id: Math.floor(Math.random() * 10000),
                });
            }, 500);
        });
    },

    /**
     * MOCK: Update existing FAQ item
     */
    async updateFAQ(item: FAQItem): Promise<FAQItem> {
        console.log('Mocking API: updateFAQ', item);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(item);
            }, 500);
        });
    },

    /**
     * MOCK: Delete FAQ item
     */
    async deleteFAQ(id: number): Promise<void> {
        console.log('Mocking API: deleteFAQ', id);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
    },

    /**
     * MOCK: Update Terms of Use links
     */
    async updateTermsLinks(links: TermsLinks): Promise<TermsLinks> {
        console.log('Mocking API: updateTermsLinks', links);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(links);
            }, 500);
        });
    },

    /**
     * MOCK: Reorder FAQs
     */
    async reorderFAQs(orderedIds: number[]): Promise<void> {
        console.log('Mocking API: reorderFAQs', orderedIds);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }
};

export default contentService;
