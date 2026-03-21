import Image from "next/image";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <button className="rounded-xl bg-blue-500 px-6 py-3 text-white shadow-lg hover:bg-blue-600">
        테스트 버튼
      </button>
    </div>
  );
}