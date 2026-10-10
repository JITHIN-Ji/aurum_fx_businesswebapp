import { useEffect, useRef, useState } from "react";
import { FileCheck2, Image, Trash2, Upload } from "lucide-react";

export default function AadhaarImageUpload({ name, title, file, imageUrl, required = false, onChange, onRemove }) {
    const inputRef = useRef(null);
    const [filePreview, setFilePreview] = useState("");

    useEffect(() => {
        if (!file) {
            setFilePreview("");
            return undefined;
        }

        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
    }, [file]);

    const removeFile = () => {
        if (inputRef.current) inputRef.current.value = "";
        onRemove(name);
    };

    const previewUrl = filePreview || imageUrl;

    return (
        <div className="rounded-lg border border-[var(--ad-line)] bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-bold">{title}{required && <span className="text-rose-600"> *</span>}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--ad-muted)]">Upload a clear, readable image of this side.</p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#F3E4E8] text-[#862A42]">
                    <Image size={17} />
                </span>
            </div>

            {previewUrl ? (
                <div className="mt-4 overflow-hidden rounded-md border border-[var(--ad-line)] bg-[#FAF8F5]">
                    <img src={previewUrl} alt={`${title} preview`} className="h-40 w-full object-contain p-2" />
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--ad-line)] bg-white px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <FileCheck2 size={16} className="shrink-0 text-emerald-700" />
                            <span className="truncate text-xs font-medium" title={file?.name || "Current Aadhaar image"}>
                                {file?.name || "Current image"}
                            </span>
                        </div>
                        {file && (
                            <button type="button" onClick={removeFile} aria-label={`Remove ${title.toLowerCase()}`}
                                className="grid size-8 shrink-0 place-items-center rounded text-[var(--ad-muted)] transition hover:bg-rose-50 hover:text-rose-700">
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <label htmlFor={`staff-aadhaar-${name}`}
                    className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#CFC5B5] bg-[#FAF8F5] px-4 py-5 text-center transition hover:border-[#862A42] hover:bg-[#FBF6F6]">
                    <span className="grid size-10 place-items-center rounded-full bg-white text-[#862A42] shadow-sm ring-1 ring-[var(--ad-line)]">
                        <Upload size={18} />
                    </span>
                    <span className="mt-3 text-sm font-semibold text-[#5A1A2B]">Choose {title.toLowerCase()}</span>
                    <span className="mt-1 text-xs text-[var(--ad-muted)]">Image files only</span>
                </label>
            )}
            <input ref={inputRef} id={`staff-aadhaar-${name}`} name={name} type="file" accept="image/*"
                required={required && !file && !imageUrl} onChange={onChange} className="sr-only" aria-label={`${title} image`} />
            {previewUrl && (
                <label htmlFor={`staff-aadhaar-${name}`}
                    className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#5A1A2B] hover:underline">
                    <Upload size={13} /> Replace image
                </label>
            )}
        </div>
    );
}
