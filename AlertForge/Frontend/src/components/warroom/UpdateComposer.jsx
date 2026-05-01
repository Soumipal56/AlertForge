import React from "react";

/**
 * UpdateComposer Component
 * Handles message input and file attachments for the War Room.
 */
const UpdateComposer = ({ 
    messageInput, 
    setMessageInput, 
    pendingFile,
    setPendingFile,
    onSendMessage, 
    onFileChange, 
    isUploading, 
    disabled,
    placeholder
}) => {
    // Determine if the send button should be enabled
    const canSend = !disabled && !isUploading && (messageInput.trim() || pendingFile);

    return (
        <div className="border-t border-white/5 bg-black/40 p-6">
            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    if (canSend) onSendMessage();
                }} 
                className="mx-auto max-w-3xl"
            >
                {/* Pending File Preview Area */}
                {pendingFile && (
                    <div className="mb-4 flex items-end gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="group relative rounded-2xl border border-white/10 bg-black/30 p-2 pr-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                {pendingFile.type === "image" ? (
                                    <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/5 bg-black/20">
                                        <img 
                                            src={pendingFile.url} 
                                            alt="Preview" 
                                            className="h-full w-full object-cover" 
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                                        <span className="text-xs font-bold uppercase">PDF</span>
                                    </div>
                                )}
                                <div className="flex-1 overflow-hidden pr-2">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Selected file</div>
                                    <div className="truncate text-xs font-medium text-slate-300">
                                        {pendingFile.name || "Document"}
                                    </div>
                                </div>
                            </div>

                            {/* Remove File Button */}
                            <button
                                type="button"
                                onClick={() => setPendingFile(null)}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                                title="Remove file"
                            >
                                <span className="text-sm">×</span>
                            </button>
                        </div>
                    </div>
                )}

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
                            disabled={!canSend}
                            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition hover:bg-slate-200 disabled:bg-slate-500 disabled:cursor-not-allowed ${
                                (!canSend) ? "opacity-50" : ""
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
