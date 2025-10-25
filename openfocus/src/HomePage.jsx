import React from 'react';
import React, { useState } from 'react';

const HomePage = () => {
    const [studySessions] = useState([
        { id: 1, location: 'Thompson Library', time: '2:00 PM', subject: 'Computer Science' },
        { id: 2, location: '18th Avenue Library', time: '4:00 PM', subject: 'Mathematics' },
        { id: 3, location: 'Science and Engineering Library', time: '6:00 PM', subject: 'Physics' },
    ]);

    return (
        <div className="home-page">
            <header>
                <h1>Welcome to OpenFocus</h1>
                <p>Find study sessions at Ohio State</p>
            </header>

            <main>
                <section className="study-sessions">
                    <h2>Active Study Sessions</h2>
                    <div className="sessions-list">
                        {studySessions.map(session => (
                            <div key={session.id} className="session-card">
                                <h3>{session.subject}</h3>
                                <p>Location: {session.location}</p>
                                <p>Time: {session.time}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="campus-map">
                    <h2>OSU Campus Map</h2>
                    <div className="map-container">
                        <iframe
                            title="OSU Campus Map"
                            src="https://www.osu.edu/map/"
                            width="100%"
                            height="400"
                            frameBorder="0"
                            style={{ border: 0 }}
                            allowFullScreen
                        />
                    </div>
                </section>
            </main>
        </div>
    );
};
export default HomePage;