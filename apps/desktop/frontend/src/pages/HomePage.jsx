import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import CardGrid from '../components/CardGrid'

const CATEGORIES = ['All', 'AI & ML', 'Frontend', 'Backend', 'CSS', 'TypeScript', 'Engineering']

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')

    const handleSearch = (query) => {
        setSearchQuery(query)
        setActiveCategory('All')
    }

    const handleCategory = (cat) => {
        setActiveCategory(cat)
        setSearchQuery(cat === 'All' ? '' : cat)
    }

    return (
        <main>
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full mb-5 tracking-wide uppercase">
                        Explore & Learn
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-5">
                        Discover Ideas That <br className="hidden sm:block" />
                        <span className="text-gray-400">Actually Matter</span>
                    </h1>
                    <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
                        Curated guides, projects, and resources for developers, creators, and curious minds.
                    </p>
                    <SearchBar onSearch={handleSearch} />
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center gap-2 mb-8 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategory(cat)}
                            className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-all duration-200 ${activeCategory === cat
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {searchQuery ? `Results for "${searchQuery}"` : 'Featured Content'}
                    </h2>
                </div>

                <CardGrid filter={searchQuery} />
            </section>

            <section id="about" className="bg-gray-50 border-t border-gray-100 mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Built for Curious Minds</h2>
                    <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed mb-8">
                        Mindkraft is a platform that brings together the best resources in technology, design, and engineering — curated for you.
                    </p>
                    <a
                        href="#"
                        className="inline-block bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors duration-200"
                    >
                        Start Exploring
                    </a>
                </div>
            </section>
        </main>
    )
}
