const footerLinks = {
    Product: ['Features', 'Pricing', 'Changelog', 'Roadmap'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Resources: ['Documentation', 'API Reference', 'Community', 'Support'],
    Legal: ['Privacy', 'Terms', 'Cookie Policy', 'Licenses'],
}

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <a href="#" className="flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 2L2 6v8h4v-4h4v4h4V6L8 2z" fill="white" />
                                </svg>
                            </span>
                            <span className="text-base font-semibold text-gray-900">Mindkraft</span>
                        </a>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Discover, learn, and explore ideas that matter.
                        </p>
                    </div>

                    {Object.entries(footerLinks).map(([section, links]) => (
                        <div key={section}>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">{section}</h4>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-8 mt-8 border-t border-gray-100 gap-4">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} Mindkraft. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
                            <a
                                key={social}
                                href="#"
                                className="text-sm text-gray-400 hover:text-gray-900 transition-colors duration-200"
                                aria-label={social}
                            >
                                {social}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
