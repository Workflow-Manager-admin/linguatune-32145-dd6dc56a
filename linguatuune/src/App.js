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
    setSongs([]);
  };

  // ---- Fetch Artists when Language is set ----
  useEffect(() => {
    if (!language) return;

    const fetchArtists = async () => {
      setLoadingArtists(true);
      setArtistError('');
      setArtists([]);
      try {
        // Fetch a few popular (handpicked) artists for the language.
        const artistNames = LANG_INFO[language].queryArtists;
        const promises = artistNames.map(name =>
          fetch(`https://theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(name)}`)
            .then(r => r.json())
        );
        const results = await Promise.all(promises);
        // Filter out null/nonexistent artists
        const found = results
          .map((res, idx) => res.artists && res.artists[0])
          .filter(Boolean);
        setArtists(found);
      } catch (err) {
        setArtistError('Failed to fetch artists.');
      } finally {
        setLoadingArtists(false);
      }
    };
    fetchArtists();
  }, [language]);

  // ---- Fetch Songs for selected artist ----
  useEffect(() => {
    if (!selectedArtist) return;

    const fetchSongs = async () => {
      setLoadingSongs(true);
      setSongError('');
      setSongs([]);
      try {
        // Fetch tracks/albums for selected artist ID
        // Get top 10 tracks: https://theaudiodb.com/api/v1/json/2/track-top10.php?s=coldplay
        const url = `https://theaudiodb.com/api/v1/json/2/track-top10.php?s=${encodeURIComponent(selectedArtist.strArtist)}`;
        const res = await fetch(url);
        const data = await res.json();
        const tracks = (data && data.track) ? data.track : [];
        setSongs(tracks);
      } catch (err) {
        setSongError('Failed to fetch songs.');
      } finally {
        setLoadingSongs(false);
      }
    };
    fetchSongs();
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

  // Step 1: Artist List
  function ArtistSongPage() {
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
                setSelectedSong(null);
                setLyrics('');
                setLyricsError('');
                setStep(1); // remain at artist/song page
              }}
            >
              <img
                src={artist.strArtistThumb || 'https://via.placeholder.com/100x100.png?text=Artist'}
                alt={artist.strArtist}
                style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', background: '#fff', marginBottom: 10, border: '2px solid var(--accent)' }}
              />
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)', marginBottom: 10 }}>
                {artist.strArtist}
              </div>
              <div style={{
                color: '#666', fontSize: 13, minHeight: 28, textAlign: 'center', maxWidth: 160
              }}>{artist.strGenre || ''}</div>

              {/* Songs list for this artist, if selected */}
              {selectedArtist && artist.idArtist === selectedArtist.idArtist && (
                <div style={{ marginTop: 12, width: '100%', minHeight: 65 }}>
                  {loadingSongs && <div>Loading songs...</div>}
                  {songError && <div style={{ color: 'red' }}>{songError}</div>}
                  {songs.length > 0
                    ? (
                      <ol style={{ margin: 0, padding: 0, listStyle: 'decimal', fontSize: 14 }}>
                        {songs.map(song => (
                          <li key={song.idTrack} style={{
                            marginBottom: 4,
                            cursor: 'pointer',
                            color: (selectedSong && selectedSong.idTrack === song.idTrack) ? "var(--primary)" : "var(--accent)",
                            fontWeight: 500
                          }}>
                            <span
                              tabIndex={0}
                              aria-label={song.strTrack}
                              onClick={() => {
                                setSelectedSong(song);
                                setLyrics(''); setLyricsError('');
                                setStep(2);
                              }}
                            >{song.strTrack}</span>
                          </li>
                        ))}
                      </ol>
                    )
                    : (!loadingSongs && 'No songs found.')}
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
