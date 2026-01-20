export interface Profile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    role: 'user' | 'admin' | 'mentor';
    created_at?: string;
}

export interface Quiz {
    id: string;
    title: string;
    category: string;
    duration_minutes: number;
    created_at?: string;
}

export interface Question {
    id: string;
    quiz_id: string;
    question_text: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation_text: string;
    question_image_url?: string;
    explanation_image_url?: string;
}

export interface Thread {
    id: string;
    author_id: string;
    title: string;
    content: string;
    image_url?: string;
    category: string;
    likes: number;
    comments_count: number;
    created_at: string;
    profiles?: Profile; // For joined data
}
