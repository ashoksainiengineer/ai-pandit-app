export interface EventTemplate {
    id: string;
    label: string;
    description?: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
}
export interface EventCategory {
    id: string;
    icon: string;
    label: string;
    color: string;
    description: string;
    events: EventTemplate[];
}
export declare const EVENT_CATEGORIES: EventCategory[];
export declare function getCategoryById(id: string): EventCategory | undefined;
export declare function getAllEventTemplates(): Array<EventTemplate & {
    categoryId: string;
}>;
export declare function templateToLifeEvent(template: EventTemplate, categoryId: string, eventDate: string, description?: string): {
    id: string;
    category: any;
    eventType: string;
    datePrecision: string;
    eventDate: string;
    description: string;
    importance: "low" | "medium" | "high" | "critical";
    icon: string;
    color: string;
};
export default EVENT_CATEGORIES;
//# sourceMappingURL=event-categories.d.ts.map