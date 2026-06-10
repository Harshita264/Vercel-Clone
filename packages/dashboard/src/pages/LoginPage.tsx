export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Vercel Clone</h1>
        <p className="text-gray-400 mb-8">Deploy your projects in seconds</p>
        <a href="http://localhost:3001/auth/github" className="px-6 py-3 bg-white text-black rounded-lg font-medium">
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}