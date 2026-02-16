import feedbackMock from '../data/FeedbackDataMock.json';
import { PaginationParams, Feedback, FeedbackResponse } from './apiTypes';

class FeedbackService {
    private feedbacks: Feedback[] = [];
    private storageKey = 'willingapp_feedbacks_mock';

    constructor() {
        this.init();
    }

    private init() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                this.feedbacks = JSON.parse(stored);
            } catch (e) {
                this.loadFromMock();
            }
        } else {
            this.loadFromMock();
        }

        // Ensure all feedbacks have a top-level id and are valid
        this.feedbacks = this.feedbacks
            .filter(f => f && f.feedback)
            .map(f => ({
                ...f,
                id: f.id || f.feedback?.id || 0
            }))
            .filter(f => f.id !== 0);
    }

    private loadFromMock() {
        const mockData = (feedbackMock as any[]) || [];
        this.feedbacks = mockData
            .filter(item => item && item.feedback)
            .map(item => ({
                ...item,
                id: item.feedback.id
            }));
        this.persist();
    }

    private persist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.feedbacks));
    }

    /**
     * Fetches feedbacks with pagination and search.
     */
    getFeedbacks = async (params: PaginationParams): Promise<FeedbackResponse> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const searchTerm = params.Filter?.Search?.SearchTerm?.toLowerCase() || '';
        let filtered = this.feedbacks;

        if (searchTerm) {
            filtered = this.feedbacks.filter(f =>
                f.feedback.message.toLowerCase().includes(searchTerm) ||
                f.feedback.name.toLowerCase().includes(searchTerm) ||
                f.feedback.email.toLowerCase().includes(searchTerm)
            );
        }

        const total = filtered.length;
        const items = filtered.slice(params.skip, params.skip + params.take);

        return {
            data: {
                items,
                total
            },
            total,
            isSuccessful: true
        } as any;
    };

    /**
     * Resolves a feedback (Close without answer).
     */
    closeFeedback = async (feedbackId: number, adminId: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

        const index = this.feedbacks.findIndex(f => f.feedback.id === feedbackId);
        if (index !== -1) {
            this.feedbacks[index].feedback.status = 2; // Closed
            this.feedbacks[index].feedback.handledBy = adminId;
            this.feedbacks[index].feedback.updateTime = new Date().toISOString();

            // In a real app we'd fetch the admin info here. 
            // For mock, we'll just set a placeholder name if it's empty
            if (!this.feedbacks[index].admin || !this.feedbacks[index].admin.id) {
                this.feedbacks[index].admin = {
                    id: adminId.toString(),
                    firstName: "Admin",
                    lastName: `#${adminId}`
                };
            }

            this.persist();
            return true;
        }
        return false;
    };

    /**
     * Resolves a feedback and sends an answer.
     */
    resolveFeedback = async (feedbackId: number, answer: string, adminId: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

        const index = this.feedbacks.findIndex(f => f.feedback.id === feedbackId);
        if (index !== -1) {
            this.feedbacks[index].feedback.status = 2; // Closed
            this.feedbacks[index].feedback.answer = answer;
            this.feedbacks[index].feedback.handledBy = adminId;
            this.feedbacks[index].feedback.updateTime = new Date().toISOString();

            if (!this.feedbacks[index].admin || !this.feedbacks[index].admin.id) {
                this.feedbacks[index].admin = {
                    id: adminId.toString(),
                    firstName: "Admin",
                    lastName: `#${adminId}`
                };
            }

            this.persist();
            return true;
        }
        return false;
    };

    /**
     * Resets the data to the original mock state.
     */
    resetData = () => {
        localStorage.removeItem(this.storageKey);
        this.init();
    };
}

const feedbackService = new FeedbackService();
export default feedbackService;
