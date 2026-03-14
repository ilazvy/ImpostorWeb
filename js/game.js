const game = {
    state: {
        playersCount: 4,
        impostorsCount: 1,
        minutes: 5,
        playerNames: ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'],
        selectedCategory: null,
        secretWord: "",
        roles: [],
        currentTurnIndex: 0,
        starterPlayerIndex: 0,
        gameStartTime: null,
        votes: []
    },

    // ===== MÉTODOS DE SETUP =====
    updatePlayers(change) {
        let newCount = this.state.playersCount + change;
        
        if (newCount >= 3 && newCount <= 20) {
            this.state.playersCount = newCount;
            
            // Asegurar que haya lógica matemática con los impostores (min 1 civil)
            if (this.state.impostorsCount >= newCount) {
                this.state.impostorsCount = newCount - 1;
            }
            
            // Re-generar nombres (mantener los guardados si existen)
            const savedNames = this.loadNames();
            this.state.playerNames = [];
            for (let i = 0; i < newCount; i++) {
                this.state.playerNames[i] = savedNames[i] || `Jugador ${i + 1}`;
            }
            
            this.updateUI();
        }
    },

    updateImpostors(change) {
        let newCount = this.state.impostorsCount + change;
        
        // Min 1 impostor, Max: Jugadores - 1
        if (newCount >= 1 && newCount < this.state.playersCount) {
            this.state.impostorsCount = newCount;
            this.updateUI();
        }
    },

    updateMinutes(change) {
        let newMinutes = this.state.minutes + change;
        
        if (newMinutes >= 1 && newMinutes <= 60) {
            this.state.minutes = newMinutes;
            this.updateUI();
        }
    },

    updateUI() {
        document.getElementById('display-players').innerText = this.state.playersCount;
        document.getElementById('display-impostors').innerText = this.state.impostorsCount;
        document.getElementById('display-minutes').innerText = this.state.minutes + ' min';
    },

    // ===== MÉTODOS DE NOMBRES (localStorage) =====
    loadNames() {
        const saved = localStorage.getItem('impostor_player_names');
        return saved ? JSON.parse(saved) : [];
    },

    saveNames() {
        localStorage.setItem('impostor_player_names', JSON.stringify(this.state.playerNames));
    },

    // ===== MÉTODOS DE JUEGO =====
    startGame(categoryName) {
        // Guardar nombres en localStorage
        this.saveNames();
        
        this.state.selectedCategory = categoryName;
        document.getElementById('final-category').innerText = categoryName;
        
        // 1. Elegir palabra aleatoria de la categoría
        const words = categoriesData[categoryName];
        this.state.secretWord = words[Math.floor(Math.random() * words.length)];
        
        // 2. Generar roles aleatorios
        this.generateRoles();
        
        // 3. Seleccionar jugador que empieza
        this.selectStarterPlayer();
        
        // 4. Empezar turnos
        this.state.currentTurnIndex = 0;
        this.state.gameStartTime = Date.now();
        this.state.votes = []; // Limpiar votos anteriores
        this.prepareTurn();
    },

    generateRoles() {
        // Llenar arreglo con inocentes
        let roles = Array(this.state.playersCount).fill('civilian');
        
        // Asignar impostores al azar
        let impostorsAssigned = 0;
        while (impostorsAssigned < this.state.impostorsCount) {
            let randomIdx = Math.floor(Math.random() * this.state.playersCount);
            if (roles[randomIdx] !== 'impostor') {
                roles[randomIdx] = 'impostor';
                impostorsAssigned++;
            }
        }
        this.state.roles = roles;
    },

    selectStarterPlayer() {
        this.state.starterPlayerIndex = Math.floor(Math.random() * this.state.playersCount);
        const starterName = this.state.playerNames[this.state.starterPlayerIndex];
        document.getElementById('starter-player-name').innerText = starterName;
    },

    // ===== GESTIÓN DE TURNOS =====
    prepareTurn() {
        const playerNum = this.state.currentTurnIndex + 1;
        const playerName = this.state.playerNames[this.state.currentTurnIndex];
        
        document.getElementById('pass-player-name').innerText = playerName;
        document.getElementById('reveal-player-name').innerText = `${playerName} (${playerNum}/${this.state.playersCount})`;
        
        // Reiniciar UI de revelación
        resetRevealUI();
        
        app.showScreen('screen-pass');
    },

    nextTurn() {
        this.state.currentTurnIndex++;
        if (this.state.currentTurnIndex < this.state.playersCount) {
            this.prepareTurn();
        } else {
            // Todos vieron sus roles, mostrar quién empieza la discusión
            app.showScreen('screen-starter');
        }
    },

    getRoleInfo() {
        const role = this.state.roles[this.state.currentTurnIndex];
        if (role === 'impostor') {
            return { text: "ERES EL IMPOSTOR", subtext: "Finge conocer la palabra", isImpostor: true };
        } else {
            return { text: this.state.secretWord, subtext: "Palabra secreta", isImpostor: false };
        }
    },

    // ===== MÉTODOS DE TIEMPO =====
    getElapsedTime() {
        if (!this.state.gameStartTime) return 0;
        return Math.floor((Date.now() - this.state.gameStartTime) / 1000);
    },

    getRemainingTime() {
        const totalSeconds = this.state.minutes * 60;
        const elapsedSeconds = this.getElapsedTime();
        return Math.max(0, totalSeconds - elapsedSeconds);
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    },

    // ===== MÉTODOS DE VOTACIÓN =====
    initializeVoting() {
        // Inicializar array de votos
        this.state.votes = new Array(this.state.playersCount).fill(0);
    },

    addVote(playerIndex) {
        if (!this.state.votes) {
            this.initializeVoting();
        }
        
        // Limitar votos al número de jugadores
        const maxVotes = this.state.playersCount;
        if (this.state.votes[playerIndex] < maxVotes) {
            this.state.votes[playerIndex]++;
            // Reproducir sonido de voto
            soundManager.playVoteSound();
            // Re-renderizar la grilla
            app.renderVotingGrid();
        }
    },

    removeVote(playerIndex) {
        if (!this.state.votes) {
            this.initializeVoting();
        }
        
        if (this.state.votes[playerIndex] > 0) {
            this.state.votes[playerIndex]--;
            // Re-renderizar la grilla
            app.renderVotingGrid();
        }
    },

    finishVoting() {
        if (!this.state.votes || this.state.votes.every(v => v === 0)) {
            alert('Debes votar por al menos un jugador');
            return;
        }

        // Encontrar al jugador con más votos
        const maxVotes = Math.max(...this.state.votes);
        const votedPlayerIndex = this.state.votes.indexOf(maxVotes);
        const votedPlayerRole = this.state.roles[votedPlayerIndex];

        // Determinar ganador
        const civilsWin = votedPlayerRole === 'impostor';
        
        // Mostrar resultado
        this.displayVotingResult(civilsWin, votedPlayerIndex);
    },

    displayVotingResult(civilsWin, votedPlayerIndex) {
        const resultDiv = document.getElementById('voting-result');
        const actionsDiv = document.getElementById('voting-actions');
        const winnerText = document.getElementById('voting-winner');
        const descriptionText = document.getElementById('voting-description');
        
        // Ocultar acciones y mostrar resultado
        actionsDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
        
        if (civilsWin) {
            // Civiles ganan
            soundManager.playWinSound();
            resultDiv.classList.remove('border-rose-600', 'bg-red-900/30');
            resultDiv.classList.add('border-emerald-600', 'bg-emerald-900/30');
            winnerText.textContent = '✓ ¡CIVILES GANAN!';
            winnerText.classList.remove('text-rose-500');
            winnerText.classList.add('text-emerald-500');
            descriptionText.innerHTML = `<span class="font-bold text-emerald-400">${this.state.playerNames[votedPlayerIndex]}</span> era el IMPOSTOR 🎉`;
        } else {
            // Impostores ganan
            soundManager.playLoseSound();
            resultDiv.classList.remove('border-emerald-600', 'bg-emerald-900/30');
            resultDiv.classList.add('border-rose-600', 'bg-red-900/30');
            winnerText.textContent = '✗ ¡IMPOSTORES GANAN!';
            winnerText.classList.remove('text-emerald-500');
            winnerText.classList.add('text-rose-500');
            descriptionText.innerHTML = `<span class="font-bold text-rose-400">${this.state.playerNames[votedPlayerIndex]}</span> era un CIVIL 💀`;
        }

        // Mostrar info extra
        descriptionText.innerHTML += `<br><br>La palabra era: <span class="font-bold text-blue-400">${this.state.secretWord}</span>`;
    }
};