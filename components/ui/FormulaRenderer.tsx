"use client";

import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface FormulaRendererProps {
    content: string;
}

export default function FormulaRenderer({ content }: FormulaRendererProps) {
    // Regex to split by:
    // 1. $$...$$ (Block math)
    // 2. $...$ (Inline math)
    // 3. ![alt](url) (Markdown image)
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|!\[.*?\]\(.*?\))/g);

    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <BlockMath key={index} math={part.slice(2, -2)} />;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    return <InlineMath key={index} math={part.slice(1, -1)} />;
                } else if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
                    const alt = part.match(/!\[(.*?)\]/)?.[1] || "";
                    const url = part.match(/\((.*?)\)/)?.[1] || "";
                    return (
                        <div key={index} className="my-4">
                            <img src={url} alt={alt} className="max-w-full h-auto rounded-xl shadow-sm border border-gray-100" />
                        </div>
                    );
                }

                // Handle newlines by splitting remaining text and adding <br />
                const textParts = part.split('\n');
                return textParts.map((t, i) => (
                    <span key={`${index}-${i}`}>
                        {t}
                        {i < textParts.length - 1 && <br />}
                    </span>
                ));
            })}
        </span>
    );
}
