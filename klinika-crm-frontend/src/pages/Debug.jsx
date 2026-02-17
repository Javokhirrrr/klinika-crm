import React from 'react';

export default function Debug() {
    return (
        <div className="p-20 text-center">
            <h1 className="text-4xl font-bold text-green-600">VERSION 2.1 IS LIVE!</h1>
            <p className="mt-4 text-xl">Updates are correctly deployed.</p>
            <p className="mt-2 text-gray-500">Time: {new Date().toLocaleTimeString()}</p>
        </div>
    );
}
