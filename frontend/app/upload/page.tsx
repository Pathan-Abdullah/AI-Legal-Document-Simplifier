"use client";

import { useState, useEffect } from "react";

type Section = {
  title: string;
  content: string;
};

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [translatedText, setTranslatedText] = useState("");
  const [loadingTranslate, setLoadingTranslate] = useState(false);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- UPLOAD ----------------
  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a file to analyze.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);
    setTranslatedText("");
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server responded with an error.");

      const data = await res.json();
      setResult(data);
    } catch {
      setError(
        "Failed to communicate with the backend. Please ensure it is running.",
      );
    }

    setLoading(false);
  };

  // ---------------- VOICE ----------------
  const speakText = () => {
    let raw = translatedText || result?.summary;

    if (typeof raw === "object") {
      raw = Object.values(raw).join(". ");
    }

    raw = raw.replace(/[{}"*\[\]]/g, "");

    const text = raw
      ?.replace(/[{}"]/g, "")
      ?.replace(/\*\*/g, "")
      ?.replace(/\n+/g, " ")
      ?.replace(/:/g, " - ")
      ?.trim();

    if (!text) return;

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const match = voices.find((v) =>
      v.lang.toLowerCase().includes(language.toLowerCase()),
    );

    if (match) utterance.voice = match;
    utterance.lang = language;
    speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => speechSynthesis.cancel();

  useEffect(() => {
    const load = () => setVoices(speechSynthesis.getVoices());
    load();
    speechSynthesis.onvoiceschanged = load;
  }, []);

  // ---------------- TRANSLATE ----------------
  const handleTranslate = async () => {
    if (!result) return;

    const text =
      typeof result.summary === "object"
        ? Object.values(result.summary).join("\n\n")
        : result.summary || result.raw_text;

    setLoadingTranslate(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          target_lang:
            language === "hi-IN"
              ? "Hindi"
              : language === "te-IN"
                ? "Telugu"
                : "English",
        }),
      });

      const data = await res.json();
      setTranslatedText(data.translated);
    } catch {
      setTranslatedText("Translation failed");
    }

    setLoadingTranslate(false);
  };

  // ---------------- PARSE ----------------
  const parseSections = (text: string): Section[] => {
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return Object.entries(parsed).map(([title, content]) => ({
        title,
        content: String(content)
          .replace(/[{}"]/g, "")
          .replace(/\*\*/g, "")
          .trim(),
      }));
    } catch (e) {
      return [{ title: "Analysis", content: text }];
    }
  };

  // ---------------- CHATBOT    ----------------

  const askQuestion = async () => {
    if (!question || !result) return;

    const context = result.raw_text;

    setLoadingChat(true);

    const newChat = [...chat, { role: "user", text: question }];
    setChat(newChat);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          context,
        }),
      });

      const data = await res.json();

      setChat([...newChat, { role: "ai", text: data.answer }]);
    } catch {
      setChat([...newChat, { role: "ai", text: "Error occurred" }]);
    }

    setQuestion("");
    setLoadingChat(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8">AI Legal Assistant</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
          <div>
            <h2 className="font-semibold mb-2">Upload Document</h2>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500 rounded text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 transition text-black py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Processing..." : "Analyze Document"}
          </button>

          {/* Controls */}
          <div className="space-y-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded"
            >
              <option value="en-IN">English</option>
              <option value="hi-IN">Hindi</option>
              <option value="te-IN">Telugu</option>
            </select>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={speakText}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-semibold transition"
              >
                Speak
              </button>
              <button
                onClick={stopSpeech}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 rounded text-white font-semibold transition"
              >
                Stop
              </button>
              <button
                onClick={handleTranslate}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-semibold transition"
              >
                {loadingTranslate ? "..." : "Translate"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 overflow-y-auto max-h-[80vh]">
          {!result && (
            <p className="text-slate-400">Upload a document to see analysis.</p>
          )}

          {result?.ai_status === "success" && (
            <>
              <h2 className="font-bold text-lg mb-4">AI Analysis</h2>

              {parseSections(result.summary).map((sec, i) => (
                <div
                  key={i}
                  className="mb-4 p-4 bg-slate-950 rounded border border-slate-800"
                >
                  <h3 className="font-semibold text-cyan-400">{sec.title}</h3>
                  <p className="mt-2 text-slate-300 whitespace-pre-wrap">
                    {sec.content}
                  </p>
                </div>
              ))}
            </>
          )}

          {result?.ai_status === "failed" && (
            <>
              <p className="text-yellow-400 mb-4">
                AI busy — showing extracted text
              </p>
              <pre className="text-sm whitespace-pre-wrap">
                {result.raw_text}
              </pre>
            </>
          )}

          {translatedText && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded">
              <h3 className="font-semibold text-green-400 mb-2">Translated</h3>
              <p className="whitespace-pre-wrap">{translatedText}</p>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-800 pt-6 md:col-span-2">
          <h2 className="text-lg font-bold mb-3">Ask Questions</h2>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {chat.map((c, i) => (
              <div
                key={i}
                className={`p-3 rounded ${
                  c.role === "user" ? "bg-cyan-600 text-black" : "bg-slate-800"
                }`}
              >
                {c.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about the document..."
              className="flex-1 p-2 rounded bg-slate-800"
            />

            <button
              onClick={askQuestion}
              className="bg-cyan-500 text-black px-4 rounded"
            >
              {loadingChat ? "..." : "Ask"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
