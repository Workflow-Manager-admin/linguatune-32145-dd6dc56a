import React, { useState, useEffect } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function LinguaTuneApp() {
  const [step, setStep] = useState(0); // 0 = select lang, 1 = artists+songs, 2 = show lyrics
  const [language, setLanguage] = useState(null); // "English" | "Tamil"
  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [artistError, setArtistError] = useState('');

  const [selectedArtist, setSelectedArtist] = useState(null);
  const [albums, setAlbums] = useState([]); // List of albums for artist
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsError, setAlbumsError] = useState('');
  const [expandedAlbumIds, setExpandedAlbumIds] = useState([]); // Album IDs expanded for tracks

  const [albumTracks, setAlbumTracks] = useState({}); // { albumId: [track, ...], ... }
  const [tracksLoading, setTracksLoading] = useState({}); // { albumId: true/false }
  const [tracksError, setTracksError] = useState({}); // { albumId: errorString }

  // ---- Videos state ----
  const [artistVideos, setArtistVideos] = useState([]); // List of videos for artist
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState('');

  const [selectedSong, setSelectedSong] = useState(null);
  const [lyrics, setLyrics] = useState('');
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState('');

  // ---- API and Color Settings ----
  // TheAudioDB: e.g. https://theaudiodb.com/api/v1/json/2/search.php?s=coldplay
  //             https://theaudiodb.com/api/v1/json/2/search.php?s=ar%20rahman
  // To get artists by language: https://www.theaudiodb.com/api/v1/json/2/search.php?s=ar%20rahman
  // Or best: Use top artists for genre + language (but language not always direct! We'll use handpicked for demo)

  const LANG_INFO = {
    English: {
      queryArtists: ["coldplay", "adele", "ed sheeran", "beatles", "rihanna", "eminem"],
      pretty: "English",
    },
    Tamil: {
      queryArtists: ["a r rahman", "sid sriram", "anirudh", "chinmayi", "yuvan shankar raja"],
      pretty: "தமிழ்",
    }
  };

  // ---- Utility: Custom Theme CSS variables for LinguaTune ----
  // Using style object for dynamic theme
  const linguaTuneVars = {
    '--primary': '#f792e4',
    '--secondary': '#fcfbf8',
    '--accent': '#131111',
    '--theme-bg': '#fcfbf8'
  };

  // ---- Language selection handler ----
  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setStep(1);
    setSelectedArtist(null);
    setSelectedSong(null);
    setLyrics('');
    setArtists([]);
    // setSongs removed: no longer used
  };

  // ---- Fetch Artists when Language is set ----
  useEffect(() => {
    if (!language) return;

    // PUBLIC_INTERFACE
    /**
     * Fetches popular artists for the selected language from TheAudioDB.
     * Handles cases where fetch fails or response is not as expected.
     */
    const fetchArtists = async () => {
      setLoadingArtists(true);
      setArtistError('');
      setArtists([]);
      try {
        const artistNames = LANG_INFO[language].queryArtists;
        // Fetch artist info in parallel and handle errors for each individually
        const promises = artistNames.map(async (name) => {
          let url = `https://theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(name)}`;
          try {
            const response = await fetch(url);
            if (!response.ok) {
              // HTTP error (network error, 5xx, 4xx)
              return null;
            }
            const res = await response.json();
            // Check for response structure and existence of artist
            if (res && Array.isArray(res.artists) && res.artists[0]) {
              return res.artists[0];
            } else {
              return null;
            }
          } catch (error) {
            // Network or parse error
            return null;
          }
        });

        const results = await Promise.all(promises);
        const found = results.filter(Boolean);

        if (found.length === 0) {
          setArtistError('No artists found or failed to fetch artist data.');
          setArtists([]);
        } else {
          setArtists(found);
        }
      } catch (err) {
        setArtistError('Failed to fetch artists (network error).');
        setArtists([]);
      } finally {
        setLoadingArtists(false);
      }
    };
    fetchArtists();
  }, [language]);

  // ---- Fetch Albums & Videos for selected artist ----
  useEffect(() => {
    if (!selectedArtist) return;

    // Reset on change
    setAlbums([]);
    setAlbumsError('');
    setAlbumsLoading(true);
    setExpandedAlbumIds([]);
    setAlbumTracks({});
    setTracksLoading({});
    setTracksError({});
    setSelectedSong(null);
    setLyrics('');
    setLyricsError('');
    setArtistVideos([]);
    setVideosError('');
    setVideosLoading(true);

    // Fetch albums by artist ID
    const fetchAlbums = async () => {
      try {
        const res = await fetch(`https://theaudiodb.com/api/v1/json/2/album.php?i=${selectedArtist.idArtist}`);
        const data = await res.json();
        let albums = (data && data.album) ? data.album : [];
        // Sort albums by intYearReleased (descending)
        albums = albums.sort((a, b) => {
          const ya = parseInt(a.intYearReleased || "0", 10);
          const yb = parseInt(b.intYearReleased || "0", 10);
          return yb - ya;
        });
        setAlbums(albums);
      } catch (err) {
        setAlbumsError('Failed to fetch albums.');
      } finally {
        setAlbumsLoading(false);
      }
    };

    // Fetch artist videos
    const fetchVideos = async () => {
      try {
        const res = await fetch(`https://theaudiodb.com/api/v1/json/2/mvid.php?i=${selectedArtist.idArtist}`);
        const data = await res.json();
        let vids = (data && data.mvids) ? data.mvids : [];
        // If sometimes the property is 'mvids' or 'mvid', do fallback
        if (!vids && data && data.mvid) {
          vids = data.mvid;
        }
        setArtistVideos(Array.isArray(vids) ? vids : []);
      } catch (err) {
        setVideosError('Failed to fetch videos.');
        setArtistVideos([]);
      } finally {
        setVideosLoading(false);
      }
    };

    fetchAlbums();
    fetchVideos();
  }, [selectedArtist]);

  // ---- Fetch Lyrics for selected song ----
  useEffect(() => {
    if (!selectedSong || !selectedArtist) return;

    const fetchLyrics = async () => {
      setLoadingLyrics(true);
      setLyricsError('');
      setLyrics('');
      try {
        // lyrics.ovh: https://api.lyrics.ovh/v1/:artist/:title
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(selectedArtist.strArtist)}/${encodeURIComponent(selectedSong.strTrack)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.lyrics && typeof data.lyrics === "string" && data.lyrics.trim() !== "") {
          setLyrics(data.lyrics);
        } else {
          setLyricsError("Lyrics not found.");
        }
      } catch (err) {
        setLyricsError("Failed to fetch lyrics.");
      } finally {
        setLoadingLyrics(false);
      }
    };
    fetchLyrics();
  }, [selectedSong, selectedArtist]);

  // ---- UI Renderers ----

  // Step 0: Language selection
  function LandingPage() {
    return (
      <div className="lingua-landing" style={{ minHeight: "70vh", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: 520, maxWidth: '98vw', gap: 32 }}>
          {/* English column */}
          <div
            className="lingua-langbox"
            style={{
              background: 'var(--secondary)',
              flex: 1, borderRadius: 18, boxShadow: '0 3px 10px #fdd3f4',
              cursor: 'pointer',
              border: '3px solid var(--primary)', minHeight: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow 0.2s',
            }}
            onClick={() => handleSelectLanguage('English')}
            tabIndex={0}
            aria-label="Select English"
          >
            <span role="img" aria-label="English" style={{ fontSize: 58, marginBottom: 8 }}>🇬🇧</span>
            <span style={{ fontWeight: 700, fontSize: 32, color: 'var(--accent)' }}>English</span>
          </div>
          {/* Tamil column */}
          <div
            className="lingua-langbox"
            style={{
              background: 'var(--secondary)',
              flex: 1, borderRadius: 18, boxShadow: '0 3px 10px #fad7da',
              cursor: 'pointer',
              border: '3px solid var(--primary)', minHeight: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow 0.2s',
            }}
            onClick={() => handleSelectLanguage('Tamil')}
            tabIndex={0}
            aria-label="Select Tamil"
          >
            <span role="img" aria-label="Tamil" style={{ fontSize: 58, marginBottom: 8 }}>🇮🇳</span>
            <span style={{ fontWeight: 700, fontSize: 32, color: 'var(--accent)' }}>தமிழ்</span>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Artist → Albums → Tracks List
  function ArtistSongPage() {
    // Fetch album tracks if not already loaded; lazy-load per expanded album
    const handleToggleAlbum = async (albumId) => {
      setExpandedAlbumIds(prev => {
        if (prev.includes(albumId)) {
          // Collapse: remove
          return prev.filter(id => id !== albumId);
        } else {
          // Expand: add
          // If not already loaded, fetch tracks
          if (!albumTracks[albumId]) {
            setTracksLoading(tl => ({ ...tl, [albumId]: true }));
            setTracksError(te => ({ ...te, [albumId]: '' }));
            fetch(`https://theaudiodb.com/api/v1/json/2/track.php?m=${albumId}`)
              .then(r => r.json())
              .then(data => {
                setAlbumTracks(at => ({ ...at, [albumId]: (data && data.track) ? data.track : [] }));
                setTracksLoading(tl => ({ ...tl, [albumId]: false }));
              })
              .catch(() => {
                setAlbumTracks(at => ({ ...at, [albumId]: [] }));
                setTracksLoading(tl => ({ ...tl, [albumId]: false }));
                setTracksError(te => ({ ...te, [albumId]: 'Failed to fetch tracks.' }));
              });
          }
          return [...prev, albumId];
        }
      });
    };

    // --- Helper to create embedded video if YouTube link available ---
    function EmbeddedVideo({ video }) {
      // Check for YouTube link
      let ytId = null;
      if (video.strMusicVid) {
        // Extract YouTube video ID from url
        const ytMatch = video.strMusicVid.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|v\/|embed\/))([a-zA-Z0-9_-]{11})/);
        ytId = ytMatch ? ytMatch[1] : null;
      }
      if (ytId) {
        return (
          <iframe
            title={video.strTrack + ' preview'}
            width="320"
            height="180"
            style={{ border: 'none', borderRadius: 8, marginTop: 6, boxShadow: '0 1px 5px #e3bfee' }}
            src={`https://www.youtube.com/embed/${ytId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
      } else if (video.strMusicVid) {
        // fallback: show link if not YouTube
        return (
          <a href={video.strMusicVid} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 500 }}>Watch Video</a>
        );
      } else {
        return null;
      }
    }

    // --- Render ---
    return (
      <div style={{ marginTop: 32 }}>
        <button className="btn" style={{ background: 'var(--primary)', marginBottom: 16, color: 'var(--accent)' }} onClick={() => { setStep(0); setLanguage(null); }}>
          ← Change Language
        </button>
        <h2 style={{ color: 'var(--primary)' }}>
          {language === "English" ? "English Artists" : "தமிழ் கலைஞர்கள்"}
        </h2>
        {loadingArtists && <div>Loading artists...</div>}
        {artistError && <div style={{ color: 'red' }}>{artistError}</div>}

        <div style={{
          display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'flex-start'
        }}>
          {artists.map((artist, i) => (
            <div
              key={artist.idArtist || i}
              className="artist-card"
              style={{
                background: 'var(--secondary)',
                boxShadow: '0 2px 7px #e5b5d8',
                border: `2.5px solid var(--primary)`,
                borderRadius: 10,
                padding: 16,
                width: 205,
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.1s',
                outline: selectedArtist && artist.idArtist === selectedArtist.idArtist ? '3px solid var(--accent)' : 'none'
              }}
              tabIndex={0}
              aria-label={artist.strArtist}
              onClick={() => {
                setSelectedArtist(artist);
                // rest is handled by effect
              }}
            >
              {/* Use TheAudioDB thumb, small variant if possible, with fallback */}
              <img
                src={
                  artist.strArtistThumb
                    ? artist.strArtistThumb + '/small'
                    : 'https://via.placeholder.com/90x90.png?text=Artist'
                }
                alt={artist.strArtist}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  background: '#fff',
                  marginBottom: 10,
                  border: '2px solid var(--accent)',
                  boxShadow: '0 0 0 2px var(--secondary)', // subtle highlight
                }}
                onError={e => {
                  // Fallback if /small is broken or base thumb is missing
                  if (artist.strArtistThumb && e.target.src.endsWith('/small')) {
                    e.target.src = artist.strArtistThumb;
                  } else {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/90x90.png?text=Artist';
                  }
                }}
                loading="lazy"
              />
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)', marginBottom: 10 }}>
                {artist.strArtist}
              </div>
              <div style={{
                color: '#666', fontSize: 13, minHeight: 28, textAlign: 'center', maxWidth: 160
              }}>{artist.strGenre || ''}</div>
              {/* Albums section for selected artist only */}
              {selectedArtist && artist.idArtist === selectedArtist.idArtist && (
                <div style={{ marginTop: 16, width: '100%' }}>
                  {albumsLoading && <div>Loading albums...</div>}
                  {albumsError && <div style={{ color: 'red' }}>{albumsError}</div>}
                  {(!albumsLoading && !albumsError && albums.length === 0) && <div>No albums found.</div>}
                  {albums.length > 0 && (
                    <div>
                      {albums.slice(0, 6).map(album => (
                        <div
                          key={album.idAlbum}
                          style={{
                            marginBottom: 14,
                            background: '#fff',
                            borderRadius: 8,
                            boxShadow: '0 1px 4px #eed7eb',
                            border: '1.5px solid var(--primary)',
                            padding: 8,
                          }}>
                          <div
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleToggleAlbum(album.idAlbum)}
                            aria-label={`Expand album: ${album.strAlbum}`}
                          >
                            <img
                              src={album.strAlbumThumb || 'https://via.placeholder.com/55x55.png?text=Album'}
                              alt={album.strAlbum}
                              style={{
                                width: 48, height: 48, borderRadius: 8, objectFit: 'cover', marginRight: 12,
                                border: '1.5px solid var(--primary)', background: '#eee'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: 700, fontSize: 15, color: 'var(--accent)'
                              }}>{album.strAlbum}</div>
                              <span style={{ color: 'var(--primary)', fontSize: 13 }}>
                                {album.intYearReleased ? `(${album.intYearReleased})` : ''}
                              </span>
                            </div>
                            <span style={{
                              fontSize: 18,
                              color: 'var(--primary)',
                              marginLeft: 10,
                              userSelect: 'none'
                            }}>
                              {expandedAlbumIds.includes(album.idAlbum) ? '▲' : '▼'}
                            </span>
                          </div>
                          {/* Tracks for album - collapsible */}
                          {expandedAlbumIds.includes(album.idAlbum) && (
                            <div style={{ marginTop: 8, marginLeft: 6, paddingBottom: 4 }}>
                              {tracksLoading[album.idAlbum] && <div>Loading tracks...</div>}
                              {tracksError[album.idAlbum] && <div style={{ color: 'red' }}>{tracksError[album.idAlbum]}</div>}
                              {albumTracks[album.idAlbum] && albumTracks[album.idAlbum].length > 0 ? (
                                <ol style={{ paddingLeft: 20, fontSize: 14, margin: 0 }}>
                                  {albumTracks[album.idAlbum].map(track => (
                                    <li key={track.idTrack}
                                      style={{
                                        marginBottom: 3,
                                        cursor: 'pointer',
                                        color: (selectedSong && selectedSong.idTrack === track.idTrack) ? "var(--primary)" : "var(--accent)",
                                        fontWeight: 500
                                      }}>
                                      <span
                                        tabIndex={0}
                                        aria-label={track.strTrack}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSong(track);
                                          setLyrics('');
                                          setLyricsError('');
                                          setStep(2);
                                        }}
                                      >
                                        {track.strTrack}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                !tracksLoading[album.idAlbum] && !tracksError[album.idAlbum] && <div style={{ color: '#aaa' }}>No tracks found.</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {albums.length > 6 &&
                        <div style={{ fontSize: 13, color: '#888', marginTop: 5, marginLeft: 4 }}>
                          Only showing first 6 albums.
                        </div>
                      }
                    </div>
                  )}

                  {/* ---- Videos section for artist ---- */}
                  <div style={{ margin: '26px 0 0 0' }}>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--accent)', marginBottom: 10 }}>
                      {language === "English" ? "Music Videos" : "கலைஞர் வீடியோக்கள்"}
                    </div>
                    {videosLoading && <div>Loading music videos...</div>}
                    {videosError && <div style={{ color: 'red' }}>{videosError}</div>}
                    {!videosLoading && !videosError && (!artistVideos || artistVideos.length === 0) && (
                      <div style={{ color: '#aaa', fontSize: 14 }}>
                        {language === "English" ? "No music videos found." : "வீடியோக்கள் கிடைக்கவில்லை"}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {artistVideos && artistVideos.map((video, idx) => (
                        <div key={video.idTrack || idx} style={{
                          background: '#f9f7fc',
                          border: '1.5px solid var(--primary)',
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ color: 'var(--accent)', fontWeight: 500, marginBottom: 6 }}>{video.strTrack || 'Video'}</div>
                          <EmbeddedVideo video={video} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* ---- End videos section ---- */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Show Lyrics
  function LyricsPage() {
    return (
      <div style={{ marginTop: 20, maxWidth: 700 }}>
        <button className="btn" style={{ background: 'var(--primary)', marginBottom: 13, color: 'var(--accent)' }} onClick={() => { setStep(1); setLyrics(''); setLyricsError(''); }}>
          ← Back to Songs
        </button>
        <h2 style={{ color: 'var(--primary)' }}>
          {selectedSong ? selectedSong.strTrack : ''} - {selectedArtist ? selectedArtist.strArtist : ''}
        </h2>
        {loadingLyrics && <div>Loading lyrics...</div>}
        {lyricsError && <div style={{ color: 'red' }}>{lyricsError}</div>}
        {lyrics && (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--accent)',
              background: '#f6f2fa',
              boxShadow: '0 2px 7px #fdd3f4',
              border: "2px solid var(--primary)",
              borderRadius: 8,
              padding: 20,
              fontSize: 17,
              marginTop: 16
            }}>
            {lyrics}
          </div>
        )}
      </div>
    );
  }

  // ---- Final UI Layout ----
  return (
    <div className="app" style={{ minHeight: '100vh', background: 'var(--theme-bg)', ...linguaTuneVars }}>
      <nav className="navbar" style={{ background: 'var(--primary)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo" style={{ color: 'var(--accent)' }}>
              <span className="logo-symbol" style={{ color: 'var(--accent)' }}>♪</span> LinguaTune
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Powered by TheAudioDB & lyrics.ovh</span>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <div className="container" style={{ marginTop: 95, paddingBottom: 40, minHeight: 600 }}>
          {step === 0 && <LandingPage />}
          {step === 1 && <ArtistSongPage />}
          {step === 2 && <LyricsPage />}
        </div>
      </main>
    </div>
  );
}

export default LinguaTuneApp;
