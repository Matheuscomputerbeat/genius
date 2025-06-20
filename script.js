// ========== CONFIGURAÇÕES ==========
const DEV_FAKE_BACKEND = true; // Troque para false ao conectar backend real!
const GAME_COLORS = ["green", "red", "yellow", "blue"];
const GENIUS_DELAY = 680; // ms

// ========== AUTENTICAÇÃO GOOGLE ==========
let currentUser = null;
let tokenGoogle = null;

function renderProfile(user) {
    document.getElementById("user-profile").innerHTML = `
        <img src="${user.picture}" alt="Avatar">
        <span>${user.name}</span>
    `;
    document.getElementById("user-profile").classList.remove("hidden");
    document.getElementById("logout-btn").classList.remove("hidden");
    document.getElementById("google-login").classList.add("hidden");
}
function clearProfile() {
    document.getElementById("user-profile").innerHTML = "";
    document.getElementById("user-profile").classList.add("hidden");
    document.getElementById("logout-btn").classList.add("hidden");
    document.getElementById("google-login").classList.remove("hidden");
}
function onGoogleSignIn(response) {
    // Para protótipo local, decodifica JWT do Google
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    currentUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture
    };
    tokenGoogle = response.credential;
    renderProfile(currentUser);
    app.enterQueue();
}
function renderGoogleButton() {
    window.google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Troque pelo seu Client ID real
        callback: onGoogleSignIn
    });
    window.google.accounts.id.renderButton(
        document.getElementById("google-login"),
        { theme: "outline", size: "large", text: "signin_with", locale: "pt-BR" }
    );
}
function logout() {
    currentUser = null;
    tokenGoogle = null;
    clearProfile();
    app.reset();
}

// ========== MOCK API BACKEND (Fila e Partida) ==========
class FakeBackend {
    constructor() {
        this.queue = []; // [{user, score}]
        this.games = []; // [{players:[{user,score}], sequence, turn, ...}]
        this.ranking = [];
    }
    joinQueue(user) {
        // Se já está em jogo, ignora
        if (this.games.some(g => g.players.some(p => p.user.id === user.id))) return;
        // Se já está na fila, ignora
        if (this.queue.find(p => p.user.id === user.id)) return;
        this.queue.push({user, score: 0});
        this.updateMatches();
    }
    leaveQueue(user) {
        this.queue = this.queue.filter(p => p.user.id !== user.id);
    }
    leaveGame(user) {
        // Remove de todos jogos
        this.games.forEach(g => {
            g.players = g.players.filter(p => p.user.id !== user.id);
        });
        // Remove jogos sem jogadores
        this.games = this.games.filter(g => g.players.length > 1);
    }
    updateMatches() {
        while (this.queue.length >= 2) {
            const p1 = this.queue.shift();
            const p2 = this.queue.shift();
            this.games.push({
                players: [p1, p2],
                sequence: [],
                currentInput: [],
                turn: 0, // 0 ou 1
                round: 0,
                active: true,
                winner: null
            });
        }
    }
    getGameByUser(user) {
        return this.games.find(g => g.players.some(p => p.user.id === user.id));
    }
    updateScore(user, score) {
        // Atualiza score em todos lugares
        for (const game of this.games) {
            for (const p of game.players) {
                if (p.user.id === user.id) p.score = score;
            }
        }
        // Atualiza Ranking
        let r = this.ranking.find(r => r.user.id === user.id);
        if (!r) {
            this.ranking.push({user, score});
        } else if (score > r.score) {
            r.score = score;
        }
        this.ranking.sort((a,b)=>b.score-a.score);
    }
    getRanking() {
        return this.ranking.slice(0, 15);
    }
}
const backend = DEV_FAKE_BACKEND ? new FakeBackend() : null;

// ========== APP ==========
const app = {
    queueInterval: null,
    gameInterval: null,
    gameState: null,
    reset() {
        clearInterval(this.queueInterval);
        clearInterval(this.gameInterval);
        document.getElementById("queue-section").classList.add("hidden");
        document.getElementById("game-section").classList.add("hidden");
        document.getElementById("ranking-section").classList.add("hidden");
    },
    enterQueue() {
        this.reset();
        this.showQueue();
        if (DEV_FAKE_BACKEND) {
            backend.joinQueue(currentUser);
            this.queueInterval = setInterval(()=>this.pollQueue(), 1200);
        }
    },
    showQueue() {
        document.getElementById("queue-section").classList.remove("hidden");
        document.getElementById("queue-status").innerText = "Aguardando outro jogador para começar a partida...";
        document.getElementById("ranking-section").classList.remove("hidden");
        this.renderRanking();
    },
    pollQueue() {
        // Checa se entrou em partida
        const game = backend.getGameByUser(currentUser);
        if (game) {
            clearInterval(this.queueInterval);
            this.startGame(game);
        } else {
            // Atualiza fila local
            document.getElementById("queue-status").innerText =
                "Aguardando outro jogador ("+(backend.queue.length)+" na fila)...";
            this.renderRanking();
        }
    },
    startGame(game) {
        this.gameState = {
            game,
            round: 0,
            turn: game.turn,
            sequence: [],
            playerIdx: game.players.findIndex(p=>p.user.id===currentUser.id),
            input: [],
            status: "show-sequence",
            isMyTurn() { return game.players[game.turn].user.id===currentUser.id; }
        };
        this.reset();
        document.getElementById("game-section").classList.remove("hidden");
        document.getElementById("leave-game-btn").classList.remove("hidden");
        this.nextRound();
    },
    nextRound() {
        const st = this.gameState;
        st.round++;
        st.sequence.push(GAME_COLORS[Math.floor(Math.random()*4)]);
        st.input = [];
        st.status = "show-sequence";
        this.renderGame();
        setTimeout(()=>this.playSequence(), 800);
    },
    playSequence() {
        const st = this.gameState;
        let i = 0;
        function next() {
            if (i >= st.sequence.length) {
                st.status = "wait-input";
                app.renderGame();
                return;
            }
            app.flashColor(st.sequence[i]);
            i++;
            setTimeout(next, GENIUS_DELAY);
        }
        next();
    },
    flashColor(color) {
        const btn = document.querySelector(`.color-btn.${color}`);
        btn.classList.add("active");
        setTimeout(()=>btn.classList.remove("active"), GENIUS_DELAY/2);
        new Audio(app.getSound(color)).play();
    },
    getSound(color) {
        // Pequenos beeps para imersão
        switch(color) {
            case "green": return "https://freesound.org/data/previews/250/250629_4486188-lq.mp3";
            case "red":   return "https://freesound.org/data/previews/250/250630_4486188-lq.mp3";
            case "yellow":return "https://freesound.org/data/previews/250/250631_4486188-lq.mp3";
            case "blue":  return "https://freesound.org/data/previews/250/250632_4486188-lq.mp3";
        }
        return "";
    },
    handleColorClick(color) {
        const st = this.gameState;
        if (st.status !== "wait-input" || !st.isMyTurn()) return;
        st.input.push(color);
        this.flashColor(color);
        // Verifica se acertou até agora
        for (let i = 0; i < st.input.length; i++) {
            if (st.input[i] !== st.sequence[i]) {
                this.lose();
                return;
            }
        }
        // Se completou a sequência
        if (st.input.length === st.sequence.length) {
            // Atualiza score
            backend.updateScore(currentUser, st.round);
            st.status = "wait-opponent";
            this.renderGame();
            setTimeout(()=>{
                // Passa a vez
                const g = backend.getGameByUser(currentUser);
                if (!g) return;
                g.turn = 1-g.turn;
                g.sequence = [...st.sequence];
                g.round = st.round;
                app.gameState.turn = g.turn;
                app.gameState.status = "show-sequence";
                app.nextRound();
            }, 1200);
        }
    },
    lose() {
        const st = this.gameState;
        st.status = "lost";
        backend.updateScore(currentUser, st.round-1);
        this.renderGame();
        setTimeout(()=>{
            // Sai do jogo
            backend.leaveGame(currentUser);
            this.reset();
            this.enterQueue();
        }, 2200);
    },
    renderGame() {
        const st = this.gameState;
        // Info jogadores
        const info = st.game.players.map((p,i)=>`
          <div class="player ${i===st.turn?"active":""}">
            <img src="${p.user.picture}" alt="${p.user.name}"/>
            <div>${p.user.name}</div>
            <div>Pontos: ${p.score}</div>
          </div>
        `).join("");
        document.getElementById("players-info").innerHTML = info;
        // Scoreboard
        document.getElementById("scoreboard").innerText =
            "Rodada: " + st.round + " | Sua pontuação: " + backend.ranking.find(r=>r.user.id===currentUser.id)?.score ?? 0;
        // Mensagem
        let msg = "";
        if (st.status==="show-sequence") msg = st.isMyTurn()?"Sua vez! Preste atenção na sequência.":"Aguardando oponente jogar...";
        if (st.status==="wait-input") msg = "Sua vez: Repita a sequência!";
        if (st.status==="wait-opponent") msg = "Aguardando oponente jogar...";
        if (st.status==="lost") msg = "Você errou! Fim de jogo.";
        document.getElementById("game-message").innerText = msg;
    },
    renderRanking() {
        const ranking = backend.getRanking();
        const list = ranking.map((r,i)=>`
            <li>
                <span>${i+1}º</span>
                <img src="${r.user.picture}" alt="${r.user.name}">
                <span>${r.user.name}</span>
                <strong>Pontos: ${r.score}</strong>
            </li>
        `).join("");
        document.getElementById("ranking-list").innerHTML = list;
    }
}

// ========== EVENTOS ==========
window.onload = function() {
    renderGoogleButton();
    document.getElementById("logout-btn").onclick = logout;
    document.querySelectorAll(".color-btn").forEach(btn => {
        btn.onclick = () => app.handleColorClick(btn.dataset.color);
    });
    document.getElementById("leave-game-btn").onclick = () => {
        backend.leaveGame(currentUser);
        app.reset();
        app.enterQueue();
    };
};

// ========== VISIBILIDADE ==========
document.addEventListener("visibilitychange", function() {
    if (document.hidden && app.gameState) {
        backend.leaveGame(currentUser);
        app.reset();
    }
});