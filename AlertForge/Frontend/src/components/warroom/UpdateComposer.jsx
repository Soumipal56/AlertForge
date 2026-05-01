import React from "react";

/**
 * UpdateComposer Component
 * Handles message input and file attachments for the War Room.
 */
const UpdateComposer = ({ 
    messageInput, 
    setMessageInput, 
    onSendMessage, 
    onFileChange, 
    isUploading, 
    disabled,
    placeholder
}) => {
    return (
        <div className="border-t border-white/5 bg-black/40 p-6">
            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    onSendMessage();
                }} 
                className="mx-auto max-w-3xl"
            >
                <div className="flex gap-3">
                    {/* Text Input Area */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder={placeholder || "Type your message..."}
                            disabled={disabled || isUploading}
                            className={`w-full rounded-2xl border border-white/10 bg-black/30 py-4 pl-6 pr-16 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/20 ${
                                (disabled || isUploading) ? "cursor-not-allowed opacity-50" : ""
                            }`}
                        />
                        <button
                            type="submit"
                            disabled={disabled || isUploading || !messageInput.trim()}
                            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition hover:bg-slate-200 disabled:bg-slate-500 disabled:cursor-not-allowed ${
                                (disabled || isUploading) ? "opacity-50" : ""
                            }`}
                        >
                            <span className="text-lg">↵</span>
                        </button>
                    </div>

                    {/* File Upload Trigger */}
                    <label 
                        className={`flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-black/30 transition hover:bg-white/5 ${
                            (disabled || isUploading) ? "cursor-not-allowed opacity-50" : ""
                        }`}
                        title="Upload Image or PDF"
                    >
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={onFileChange}
                            disabled={disabled || isUploading}
                            accept="image/*,application/pdf"
                        />
                        <span className={`text-xl ${isUploading ? "animate-pulse text-sky-400" : "text-slate-400"}`}>
                            {isUploading ? "..." : "📎"}
                        </span>
                    </label>
                </div>
            </form>
        </div>
    );
};

export default UpdateComposer;
