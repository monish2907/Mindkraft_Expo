import Card from './Card'

const CARDS = [
    {
        id: 1,
        title: 'Getting Started with Machine Learning',
        description: 'A comprehensive guide to understanding the fundamentals of machine learning, from algorithms to real-world applications.',
        category: 'AI & ML',
        readTime: 8,
    },
    {
        id: 2,
        title: 'Building Scalable APIs with Node.js',
        description: 'Learn how to design and build robust, production-ready REST APIs using Node.js and Express with best practices baked in.',
        category: 'Backend',
        readTime: 12,
    },
    {
        id: 3,
        title: 'Modern React Patterns in 2024',
        description: 'Explore the latest React design patterns including compound components, render props, and custom hooks for cleaner code.',
        category: 'Frontend',
        readTime: 6,
    },
    {
        id: 4,
        title: 'System Design Interview Handbook',
        description: 'Master the core concepts of system design — scalability, load balancing, caching, and database partitioning.',
        category: 'Engineering',
        readTime: 15,
    },
    {
        id: 5,
        title: 'CSS Grid vs Flexbox: When to Use Which',
        description: 'A deep dive into the differences between CSS Grid and Flexbox, with practical examples for everyday layout problems.',
        category: 'CSS',
        readTime: 5,
    },
    {
        id: 6,
        title: 'TypeScript for JavaScript Developers',
        description: 'Transition from JavaScript to TypeScript smoothly with this step-by-step guide covering types, interfaces, and generics.',
        category: 'TypeScript',
        readTime: 10,
    },
]

export default function CardGrid({ filter }) {
    const filtered = filter
        ? CARDS.filter(
            (c) =>
                c.title.toLowerCase().includes(filter.toLowerCase()) ||
                c.category.toLowerCase().includes(filter.toLowerCase()) ||
                c.description.toLowerCase().includes(filter.toLowerCase())
        )
        : CARDS

    if (filtered.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 text-base">No results found for &ldquo;{filter}&rdquo;</p>
            </div>
        )
    }

    return (
        <div id="explore" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((card) => (
                <Card key={card.id} {...card} />
            ))}
        </div>
    )
}
