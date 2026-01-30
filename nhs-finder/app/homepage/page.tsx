export default function HomePage() {
    const listData = [
        { title: "Jessops Wing A", content: "Details about Building A" },
        { title: "Radiology B", content: "Details about Building B" },
        { title: "AI Building C", content: "Details about Building C" },
      ];
  return (
    <main className='max-w-2xl mx-auto py-10'>
      <h1>Welcome to NHS Finder</h1>
      <p>Your gateway to healthcare services.</p>
      <p>What Building do you want to go to? </p>
      <div className='min-h-screen bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white'>
      </div>
      
      
    </main>
  );
}