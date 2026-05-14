import React from 'react';

interface AgentSelectInputProps {
    options: string[];
    onSelect: (value: string) => void;
    disabled?: boolean;
}

export const AgentSelectInput: React.FC<AgentSelectInputProps> = ({
    options,
    onSelect,
    disabled = false,
}) => {
    return (
        <div className="my-3 p-2">
            <div className="flex max-w-2xl flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => onSelect(option)}
                        disabled={disabled}
                        type="button"
                        className="
                            w-fit max-w-full
                            rounded-md border border-gray-200
                            bg-white px-4 py-2.5
                            text-left text-sm font-medium text-gray-800
                            shadow-sm transition-all duration-200
                            hover:border-blue-500 hover:bg-gray-50
                            hover:shadow
                            focus:outline-none focus:ring-2 focus:ring-blue-100
                            disabled:cursor-not-allowed disabled:opacity-50
                            dark:border-gray-600
                            dark:bg-gray-700
                            dark:text-gray-100
                            dark:hover:bg-gray-600
                        "
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};