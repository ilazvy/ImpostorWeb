// --- LÓGICA DEL BOTÓN HOLD (Mantener Presionado) ---
const btnHold = document.getElementById('btn-hold');
const container = document.getElementById('secret-container');
const secretText = document.getElementById('secret-text');
const secretSubtext = document.getElementById('secret-subtext');
const secretIcon = document.getElementById('secret-icon');
const btnNextTurn = document.getElementById('btn-next-turn');

let isHolding = false;

function resetRevealUI() {
    container.classList.remove('bg-rose-600', 'bg-emerald-600', 'border-transparent');
    container.classList.add('bg-brand-light', 'border-slate-600');
    
    secretIcon.className = "ph-duotone ph-eye-slash text-5xl text-slate-500 mb-2";
    secretText.innerText = "???";
    secretText.className = "text-3xl font-bold text-slate-500";
    secretSubtext.classList.add('hidden');
    
    btnHold.classList.remove('hidden', 'active-touch');
    btnHold.innerHTML = `<i class="ph-bold ph-hand-pointing text-2xl"></i> MANTENER PRESIONADO`;
    btnNextTurn.classList.add('hidden');
}

function handleHoldStart(e) {
    // Evitar comportamiento por defecto en móviles (como abrir menú de contexto)
    if(e.type === 'touchstart') e.preventDefault();
    if(isHolding) return;
    isHolding = true;

    const roleInfo = game.getRoleInfo();
    
    // Cambiar estilos visuales
    btnHold.classList.add('active-touch');
    container.classList.remove('bg-brand-light', 'border-slate-600');
    container.classList.add('border-transparent');
    
    secretIcon.classList.add('hidden');
    secretSubtext.classList.remove('hidden');
    
    if (roleInfo.isImpostor) {
        container.classList.add('bg-rose-600');
        secretText.className = "text-3xl font-black text-white pop-in";
        secretSubtext.className = "text-rose-200 mt-2 font-medium pop-in";
    } else {
        container.classList.add('bg-emerald-600');
        secretText.className = "text-4xl font-black text-white pop-in";
        secretSubtext.className = "text-emerald-200 mt-2 font-medium pop-in";
    }

    secretText.innerText = roleInfo.text;
    secretSubtext.innerText = roleInfo.subtext;
    btnHold.innerHTML = `<i class="ph-bold ph-eye text-2xl"></i> VIENDO...`;
}

function handleHoldEnd(e) {
    if(e && e.type === 'touchend') e.preventDefault();
    if(!isHolding) return;
    isHolding = false;

    // Al soltar, regresamos el contenedor a modo oculto
    container.className = "bg-brand-light w-full h-48 rounded-[2rem] flex flex-col items-center justify-center mb-10 border-2 border-dashed border-slate-600 transition-all duration-300";
    
    secretIcon.className = "ph-duotone ph-check-circle text-5xl text-slate-500 mb-2 pop-in";
    secretIcon.classList.remove('hidden');
    
    secretText.innerText = "ROL OCULTO";
    secretText.className = "text-xl font-bold text-slate-500 pop-in";
    secretSubtext.classList.add('hidden');

    btnHold.classList.remove('active-touch');
    btnHold.innerHTML = `<i class="ph-bold ph-hand-pointing text-2xl"></i> VOLVER A VER`;
    
    // Mostrar botón para avanzar turno una vez que ya lo vieron al menos una vez
    btnNextTurn.classList.remove('hidden');
}

// Asignar eventos de mouse (PC) y Touch (Celular)
btnHold.addEventListener('mousedown', handleHoldStart);
btnHold.addEventListener('mouseup', handleHoldEnd);
btnHold.addEventListener('mouseleave', handleHoldEnd);

btnHold.addEventListener('touchstart', handleHoldStart, {passive: false});
btnHold.addEventListener('touchend', handleHoldEnd, {passive: false});
btnHold.addEventListener('touchcancel', handleHoldEnd, {passive: false});

// Prevenir el menú de click derecho en móviles
window.addEventListener('contextmenu', function (e) { 
    e.preventDefault(); 
});
