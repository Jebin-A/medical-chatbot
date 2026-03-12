import { useDropzone } from "react-dropzone";

export default function Dropzone({ file, setFile }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [], "image/jpeg": [], "image/png": [] },
    maxFiles: 1,
    onDrop: (accepted) => { if (accepted.length > 0) setFile(accepted[0]); }
  });

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? "active" : ""} ${file ? "has-file" : ""}`}>
      <input {...getInputProps()} />
      {file ? (
        <p className="drop-text">✅ File ready</p>
      ) : isDragActive ? (
        <p className="drop-text">Drop it here...</p>
      ) : (
        <>
          <p className="drop-icon">⬆️</p>
          <p className="drop-text">Drag & drop your report here</p>
          <p className="drop-sub">or click to browse</p>
        </>
      )}
    </div>
  );
}