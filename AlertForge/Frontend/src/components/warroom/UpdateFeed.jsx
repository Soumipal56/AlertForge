import React from "react";

/**
 * UpdateFeed Component
 * Renders a list of war room messages with support for text, images, and PDFs.
 * 
 * @param {Object} props
 * @param {Array} props.messages - List of normalized message objects.
 */
const UpdateFeed = ({ messages }) => {
    if (!messages || messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 text-3xl opacity-20">💬</div>
                <p className="text-slate-500">No messages yet. Start the conversation!</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message) => (
                <article 
                    key={message.id} 
                    className="group rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-white/20"
                >
                    {/* Header: Sender and Timestamp */}
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-200">
                            {message.sender?.name || "Unknown Participant"}
                        </span>
                        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                    </div>

                    {/* Content Area */}
                    <div className="mt-2 space-y-3">
                        {/* 1. Media Rendering */}
                        {message.fileUrl && (
                            <div className="mt-1">
                                {message.fileType === "image" ? (
                                    <a 
                                        href={message.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block overflow-hidden rounded-xl border border-white/10 bg-black/40"
                                    >
                                        <img 
                                            src={message.fileUrl} 
                                            alt="Shared media" 
                                            className="max-h-[300px] w-auto max-w-full rounded-xl object-contain transition-transform duration-300 hover:scale-[1.02]"
                                        />
                                    </a>
                                ) : message.fileType === "pdf" ? (
                                    <a 
                                        href={message.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                                            <span className="text-xl font-bold">PDF</span>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="truncate text-sm font-medium text-slate-200">
                                                View Shared Document
                                            </div>
                                            <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                                                Click to open in new tab
                                            </div>
                                        </div>
                                        <div className="text-slate-400">
                                            <span className="text-lg">↗</span>
                                        </div>
                                    </a>
                                ) : null}
                            </div>
                        )}

                        {/* 2. Text Content (Caption or Message) */}
                        {message.content && (
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {message.content}
                            </p>
                        )}
                    </div>
                </article>
            ))}
        </div>
    );
};

export default UpdateFeed;
