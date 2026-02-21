export default function Card({ title, description, category, readTime, image }) {
    return (
        <article className="group bg-white rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
            <div className="relative overflow-hidden bg-gray-100 h-44">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                        </svg>
                    </div>
                )}
                <span className="absolute top-3 left-3 bg-white text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {category}
                </span>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 group-hover:text-gray-700 transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3">
                    {description}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{readTime} min read</span>
                    <button className="text-xs font-medium text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-1">
                        Read more
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </article>
    )
}
