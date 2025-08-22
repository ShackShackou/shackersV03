import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: './index.html',
                login: './public/login.html',
                home: './home.html',
                game: './game.html',
                myShackers: './my-shackers.html',
                createShacker: './create-shacker.html',
                selectOpponent: './select-opponent.html',
                arena: './arena.html'
            },
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 5174,
        strictPort: false
    }
});
