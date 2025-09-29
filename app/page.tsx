import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Vidluna Embed
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Modern HLS video player with subtitle support and custom theming
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/docs"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="/embed/movie/550?color=ef4444"
              className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">🎬 Movies</h2>
            <p className="text-muted-foreground mb-4">Embed any movie using its TMDB ID</p>
            <code className="bg-muted px-3 py-2 rounded text-sm block">/embed/movie/550</code>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">📺 TV Shows</h2>
            <p className="text-muted-foreground mb-4">Embed specific episodes with season/episode numbers</p>
            <code className="bg-muted px-3 py-2 rounded text-sm block">/embed/tv/1434/22/9</code>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="font-medium mb-2">Multiple Servers</h3>
              <p className="text-sm text-muted-foreground">
                Veronica (US) and Vienna (Austria) with automatic failover
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-medium mb-2">Subtitles</h3>
              <p className="text-sm text-muted-foreground">Multi-language subtitles from Wyzie and Rainsubs</p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-medium mb-2">Custom Theming</h3>
              <p className="text-sm text-muted-foreground">URL-based color customization for brand matching</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Quick Examples</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Basic Movie Embed</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`<iframe 
  src="/embed/movie/550" 
  width="100%" 
  height="500"
  frameborder="0"
  allowfullscreen>
</iframe>`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">TV Show with Custom Color</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`<iframe 
  src="/embed/tv/1434/22/9?color=3b82f6" 
  width="100%" 
  height="500"
  frameborder="0"
  allowfullscreen>
</iframe>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
