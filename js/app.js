// ===== SISTEMA DE SONIDOS =====
const soundManager = {
    // Función para reproducir un sonido
    play(soundName) {
        const audio = new Audio(`sfx/${soundName}.mp3`);
        audio.volume = 0.7;
        audio.play().catch(err => console.log('Error reproduciendo sonido:', err));
    },

    // Reproducir sonido de voto
    playVoteSound() {
        this.play('votesfx');
    },

    // Reproducir sonido aleatorio de victoria civil
    playWinSound() {
        const randomEffect = Math.floor(Math.random() * 3) + 1;
        this.play(`win-effect-${randomEffect}`);
    },

    // Reproducir sonido aleatorio de derrota civil (victoria impostor)
    playLoseSound() {
        const randomEffect = Math.floor(Math.random() * 6) + 1;
        this.play(`lose-effect-${randomEffect}`);
    }
};

const app = {
    screens: ['screen-home', 'screen-setup', 'screen-names', 'screen-categories', 'screen-starter', 'screen-pass', 'screen-reveal', 'screen-game', 'screen-voting'],
    timerInterval: null,
    
    showScreen(screenId) {
        // Ocultar todas las pantallas
        this.screens.forEach(id => {
            document.getElementById(id).classList.add('hidden-screen');
        });
        // Mostrar la deseada
        document.getElementById(screenId).classList.remove('hidden-screen');
        
        // Si abrimos setup, cargar nombres guardados inicialmente
        if(screenId === 'screen-setup') {
            const savedNames = game.loadNames();
            if (savedNames.length > 0) {
                // Cargar nombres guardados al estado
                game.state.playerNames = savedNames.slice(0, game.state.playersCount);
                // Completar si hay menos nombres guardados que jugadores
                for (let i = game.state.playerNames.length; i < game.state.playersCount; i++) {
                    game.state.playerNames[i] = `Jugador ${i + 1}`;
                }
            }
        }
        
        // Si abrimos la pantalla de nombres, renderizarlas
        if(screenId === 'screen-names') {
            this.renderNamesInputs();
        }
        
        // Si abrimos la pantalla de categorías, renderizarlas
        if(screenId === 'screen-categories') {
            this.renderCategories();
        }

        // Si abrimos la pantalla de votación, renderizarla
        if(screenId === 'screen-voting') {
            game.initializeVoting();
            this.renderVotingGrid();
            // Limpiar el resultado anterior
            const resultDiv = document.getElementById('voting-result');
            resultDiv.classList.add('hidden');
            resultDiv.classList.remove('border-rose-600', 'bg-red-900/30', 'border-emerald-600', 'bg-emerald-900/30');
            resultDiv.classList.add('border-slate-700', 'bg-brand-light');
            document.getElementById('voting-actions').classList.remove('hidden');
        }
        
        // Si abrimos home, detener temporizador
        if(screenId === 'screen-home') {
            this.stopTimer();
            this.closeModal();
        }
    },

    startGameDiscussion() {
        // Inicia el juego real con el temporizador
        game.state.gameStartTime = Date.now();
        this.showScreen('screen-game');
        this.startTimer();
    },

    renderNamesInputs() {
        const container = document.getElementById('names-input-container');
        container.innerHTML = ''; // Limpiar previo
        
        const playerCount = game.state.playersCount;
        const savedNames = game.loadNames();
        
        for (let i = 0; i < playerCount; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Jugador ${i + 1}`;
            input.value = savedNames[i] || `Jugador ${i + 1}`;
            input.className = 'w-full bg-brand-light border border-slate-600 text-white px-4 py-3 rounded-xl placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-sm sm:text-base';
            input.onchange = () => {
                game.state.playerNames[i] = input.value || `Jugador ${i + 1}`;
            };
            container.appendChild(input);
        }
    },

    renderCategories() {
        const grid = document.getElementById('categories-grid');
        grid.innerHTML = ''; // Limpiar previo
        
        Object.keys(categoriesData).forEach(cat => {
            const iconClass = categoryIcons[cat] || "ph-folder";
            const btn = document.createElement('button');
            btn.className = "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-accent text-xs sm:text-sm font-semibold text-white";
            btn.onclick = () => game.startGame(cat);
            
            btn.innerHTML = `
                <i class="ph-duotone ${iconClass} text-3xl sm:text-4xl text-brand-accent mb-1"></i>
                <span>${cat}</span>
            `;
            grid.appendChild(btn);
        });
    },

    renderVotingGrid() {
        const grid = document.getElementById('voting-grid');
        grid.innerHTML = '';
        
        const playerCount = game.state.playersCount;
        
        for (let i = 0; i < playerCount; i++) {
            const card = document.createElement('div');
            const voteCount = game.state.votes[i] || 0;
            
            card.className = 'bg-brand-light border-2 border-slate-600 hover:border-brand-accent p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all';
            
            card.innerHTML = `
                <i class="ph-duotone ph-user-circle text-4xl sm:text-5xl text-brand-accent"></i>
                <p class="font-bold text-xs sm:text-sm text-center truncate w-full">${game.state.playerNames[i]}</p>
                <div class="flex items-center gap-2 mt-2">
                    <button onclick="game.removeVote(${i})" class="bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 py-1 rounded text-xs transition-colors ${voteCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}">−</button>
                    <div class="bg-brand-dark rounded-full px-3 py-1">
                        <p class="text-xs sm:text-sm font-black text-brand-accent">${voteCount}</p>
                    </div>
                    <button onclick="game.addVote(${i})" class="bg-brand-accent hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-xs transition-colors">+</button>
                </div>
            `;
            grid.appendChild(card);
        }
    },

    startTimer() {
        this.stopTimer(); // Detener si ya existe
        
        const updateTimer = () => {
            const remaining = game.getRemainingTime();
            const formattedTime = game.formatTime(remaining);
            document.getElementById('timer-display').innerText = formattedTime;
            
            // Cambiar color si quedan menos de 60 segundos
            const timerDisplay = document.getElementById('timer-display');
            if (remaining < 60) {
                timerDisplay.classList.add('text-rose-500');
                timerDisplay.classList.remove('text-brand-accent');
            } else {
                timerDisplay.classList.remove('text-rose-500');
                timerDisplay.classList.add('text-brand-accent');
            }
            
            // Si se acabó el tiempo, parar
            if (remaining <= 0) {
                this.stopTimer();
            }
        };
        
        updateTimer(); // Actualizar inmediatamente
        this.timerInterval = setInterval(updateTimer, 100); // Actualizar cada 100ms
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    endGame() {
        this.stopTimer();
        this.showModal('La ronda ha terminado. ¡Vuelve a jugar!');
        this.showScreen('screen-home');
    },

    showModal(message) {
        document.getElementById('modal-message').innerText = message;
        document.getElementById('modal-round-end').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-round-end').classList.add('hidden');
    }
};