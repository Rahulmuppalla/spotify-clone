-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist
DROP TABLE IF EXISTS recently_played CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS playlist_songs CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255) DEFAULT 'Single',
    duration INTEGER NOT NULL,
    audio_url VARCHAR(1024) NOT NULL,
    cover_url VARCHAR(1024) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Playlists table
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url VARCHAR(1024),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Playlist-Songs Junction table
CREATE TABLE playlist_songs (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id)
);

-- Create Likes table
CREATE TABLE likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id)
);

-- Create Recently Played table
CREATE TABLE recently_played (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Users
-- Password for both users: password123
INSERT INTO users (id, username, email, password, is_admin) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Admin Spotify',
    'admin@spotify.com',
    '$2a$10$v7g92vI3MscY.X5mD3K7Nu6V3W.v9Nq2Gg2jJb.U.tXhG1o4w/2vK',
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000001',
    'Demo Listener',
    'user@spotify.com',
    '$2a$10$v7g92vI3MscY.X5mD3K7Nu6V3W.v9Nq2Gg2jJb.U.tXhG1o4w/2vK',
    FALSE
);

-- Seed Songs
INSERT INTO songs (
    id,
    title,
    artist,
    album,
    duration,
    audio_url,
    cover_url,
    uploaded_by
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'Synthwave Dreams',
    'Helix Project',
    'Cosmic Journey',
    372,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'Echoes of the Void',
    'Starlight Explorer',
    'Galaxy Odyssey',
    423,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'Cybernetic Lounge',
    'SoundHelix Band',
    'Neon Nights',
    302,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'Retro Future Beats',
    'Wave Generator',
    'Synth Hits',
    502,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'c0000000-0000-0000-0000-000000000005',
    'Chill Vibes',
    'Helix Project',
    'Cosmic Journey',
    340,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'c0000000-0000-0000-0000-000000000006',
    'Ambient Space Flight',
    'Galaxy Odyssey',
    'Galaxy Odyssey',
    570,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=500&q=80',
    'a0000000-0000-0000-0000-000000000001'
);

-- Seed Playlist
INSERT INTO playlists (
    id,
    name,
    description,
    cover_url,
    user_id
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'Late Night Coding',
    'Atmospheric beats to help you stay focused during coding marathons.',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
    'b0000000-0000-0000-0000-000000000001'
);

-- Add Songs to Playlist
INSERT INTO playlist_songs (playlist_id, song_id) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001'
),
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003'
),
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000004'
);

-- Seed Likes
INSERT INTO likes (user_id, song_id) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001'
),
(
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002'
);
