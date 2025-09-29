# Vidluna Embed Player

A modern, feature-rich video player with HLS streaming support, subtitle integration, and customizable theming.

## Features

- **HLS Streaming**: Supports adaptive bitrate streaming with HLS.js
- **Multiple Servers**: Automatic failover between Veronica (US) and Vienna (Austria) servers
- **Subtitle Support**: Fetches subtitles from Wyzie and Rainsubs APIs with VTT/SRT support
- **Custom Theming**: URL-based color customization
- **Keyboard Controls**: Full keyboard navigation support
- **Episode Navigation**: Built-in episode list for TV shows
- **Responsive Design**: Works on desktop and mobile devices
- **Fullscreen Support**: Custom fullscreen controls with player overlay

## URL Parameters

### Basic Usage

\`\`\`
/embed/movie/{tmdb_id}
/embed/tv/{tmdb_id}/{season}/{episode}
\`\`\`

### Customization Parameters

| Parameter | Description | Example | Default |
|-----------|-------------|---------|---------|
| `color` | Accent color (hex without #) | `?color=ff6b6b` | `ef4444` |
| `autoplay` | Auto-start playback | `?autoplay=true` | `false` |
| `server` | Preferred server | `?server=vienna` | `veronica` |
| `subtitle` | Default subtitle language | `?subtitle=en` | `none` |

### Example URLs

\`\`\`
# Movie with custom red theme
/embed/movie/550?color=dc2626

# TV show episode with blue theme and autoplay
/embed/tv/1434/22/9?color=3b82f6&autoplay=true

# Movie with Vienna server preference
/embed/movie/550?server=vienna&color=10b981
\`\`\`

## Embedding in Your Website

### Basic Embed

\`\`\`html
<iframe 
  src="https://your-domain.com/embed/movie/550" 
  width="100%" 
  height="500"
  frameborder="0"
  allowfullscreen>
</iframe>
\`\`\`

### Responsive Embed

\`\`\`html
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
  <iframe 
    src="https://your-domain.com/embed/tv/1434/1/1?color=ef4444" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0"
    allowfullscreen>
  </iframe>
</div>
\`\`\`

### JavaScript Integration

\`\`\`javascript
// Create player dynamically
function createPlayer(containerId, type, id, season = null, episode = null, options = {}) {
  const container = document.getElementById(containerId);
  const params = new URLSearchParams();
  
  if (options.color) params.set('color', options.color);
  if (options.autoplay) params.set('autoplay', 'true');
  if (options.server) params.set('server', options.server);
  
  const url = season && episode 
    ? `/embed/${type}/${id}/${season}/${episode}?${params}`
    : `/embed/${type}/${id}?${params}`;
    
  container.innerHTML = `
    <iframe 
      src="${url}" 
      width="100%" 
      height="500"
      frameborder="0"
      allowfullscreen>
    </iframe>
  `;
}

// Usage
createPlayer('player-container', 'movie', '550', null, null, {
  color: 'ef4444',
  autoplay: true
});
\`\`\`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play/Pause |
| `F` | Toggle Fullscreen |
| `M` | Toggle Mute |
| `←` | Seek backward 10s |
| `→` | Seek forward 10s |
| `↑` | Volume up |
| `↓` | Volume down |

## Server Configuration

### Veronica Server (US)
- **Provider**: Videasy
- **Location**: United States
- **Best for**: North American users
- **Reliability**: Primary server with high uptime

### Vienna Server (Austria)
- **Provider**: Vidlink
- **Location**: Austria
- **Best for**: European users
- **Reliability**: Backup server with automatic failover

## Subtitle Support

### Supported Formats
- **SRT**: SubRip subtitle format
- **VTT**: WebVTT format
- **Auto-conversion**: SRT files are automatically converted to VTT

### Subtitle Sources
- **Wyzie API**: Primary subtitle provider
- **Rainsubs API**: Secondary subtitle provider
- **Multi-language**: Supports multiple languages with flag indicators

### Subtitle Features
- Real-time synchronization
- Customizable styling
- Hearing impaired support
- Offset adjustment

## API Endpoints

### Stream Endpoint
\`\`\`
GET /api/rainsubs?tmdbId={id}&server={server}&season={season}&episode={episode}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "streamUrl": "https://example.com/stream.m3u8",
  "subtitles": [...],
  "server": "veronica",
  "metadata": {
    "tmdbId": "550",
    "type": "movie",
    "season": null,
    "episode": null
  }
}
\`\`\`

### TMDB Metadata Endpoint
\`\`\`
GET /api/tmdb?type={type}&id={id}&season={season}&episode={episode}
\`\`\`

## Customization

### Color Themes

The player supports custom accent colors that theme the entire interface:

\`\`\`css
/* Example color applications */
.accent-color {
  color: var(--accent-color);
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}
\`\`\`

### CSS Variables

The player uses CSS custom properties for theming:

\`\`\`css
:root {
  --accent-color: #ef4444;
  --accent-color-20: rgba(239, 68, 68, 0.2);
  --background: #000000;
  --foreground: #ffffff;
}
\`\`\`

## Browser Support

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+

## Performance

- **HLS.js**: Efficient adaptive streaming
- **Lazy Loading**: Components load on demand
- **Memory Management**: Automatic cleanup of video resources
- **Buffer Management**: Optimized buffering for smooth playback

## Security

- **CORS**: Proper cross-origin resource sharing
- **CSP**: Content Security Policy compliant
- **HTTPS**: Secure streaming over encrypted connections
- **API Rate Limiting**: Built-in request throttling

## Troubleshooting

### Common Issues

1. **Video won't play**
   - Check if the TMDB ID is correct
   - Try switching servers using the cloud button
   - Ensure your browser supports HLS

2. **Subtitles not loading**
   - Verify subtitle availability for the content
   - Check network connectivity
   - Try refreshing the player

3. **Slow loading**
   - Switch to a different server
   - Check your internet connection
   - Clear browser cache

### Error Codes

- `400`: Invalid TMDB ID or parameters
- `404`: Content not found on server
- `500`: Server error or network issue
- `503`: Service temporarily unavailable

## Development

### Local Setup

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

### Environment Variables

\`\`\`env
TMDB_API_KEY=your_tmdb_api_key
\`\`\`

## License

This project is licensed under the MIT License.
