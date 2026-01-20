"use client";

import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface FormulaRendererProps {
    content: string;
}

export default function FormulaRenderer({ content }: FormulaRendererProps) {
    // Basic regex to find $...$ or $$...$$
    // Note: This is a simplified version. For production, a more robust parser might be better.
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <BlockMath key={index} math={part.slice(2, -2)} />;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    return <InlineMath key={index} math={part.slice(1, -1)} />;
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}
