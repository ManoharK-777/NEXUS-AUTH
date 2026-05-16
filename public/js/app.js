window.addEventListener('load', () => {
    const preloader = document.getElementById('nexus-preloader');
    if (preloader) {
        // Allow clicking to skip
        preloader.addEventListener('click', () => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 600);
        });

        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }, 2500); 
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // API Configuration
    // When deploying: Replace with your Render URL (e.g., 'https://nexus-auth-backend.onrender.com')
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' 
        : 'https://nexus-auth-03fd.onrender.com'; // Real Render Backend URL

    // UI Elements
    const form = document.getElementById('nexus-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const pinInput = document.getElementById('pin');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('submit-btn');
    
    // Widgets
    const terminalScreen = document.getElementById('terminal-screen');
    const threatLogs = document.getElementById('threat-logs');
    const entropyCircle = document.querySelector('.circle');
    const entropyScoreText = document.querySelector('.score-text');
    const entropyStatus = document.querySelector('.entropy-status');
    
    // Status Trackers
    const validationState = {
        username: false,
        email: false,
        phone: false,
        pin: false,
        password: false,
        confirm: false
    };

    // Helper: Add log to terminal
    const addTerminalLog = (msg, isError = false) => {
        const p = document.createElement('p');
        p.textContent = msg;
        if (isError) p.style.color = 'var(--red)';
        terminalScreen.appendChild(p);
        terminalScreen.scrollTop = terminalScreen.scrollHeight;
    };

    // Helper: Add log to threat detection
    const addThreatLog = (msg, isAlert = false) => {
        const p = document.createElement('p');
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        p.textContent = `[${time}] ${msg}`;
        if (isAlert) p.style.color = 'var(--red)';
        threatLogs.appendChild(p);
        if (threatLogs.children.length > 4) {
            threatLogs.removeChild(threatLogs.firstChild);
        }
    };

    // Simulated Random Threat Scans
    setInterval(() => {
        const events = [
            "Network packet analysis complete.",
            "Port 443 secure.",
            "Scanning for unauthorized access...",
            "No anomalies detected.",
            "Firewall protocols nominal."
        ];
        const alertEvents = [
            "WARNING: Unusual traffic pattern detected.",
            "ALERT: Analyzing encrypted payload...",
            "INTERCEPTION: Blocking ping request."
        ];
        
        if (Math.random() > 0.8) {
            addThreatLog(alertEvents[Math.floor(Math.random() * alertEvents.length)], true);
        } else {
            addThreatLog(events[Math.floor(Math.random() * events.length)]);
        }
    }, 4000);

    // Update Input UI State
    const setInputState = (input, isValid, message, isFeedback = true) => {
        const wrapper = input.closest('.input-group');
        const icon = input.nextElementSibling;
        const feedback = wrapper.querySelector('.feedback');
        
        icon.className = 'status-icon'; // reset
        if (isValid === true) {
            icon.classList.add('valid');
            if (isFeedback) {
                feedback.textContent = message || 'VALIDATED';
                feedback.className = 'feedback success';
            }
        } else if (isValid === false) {
            icon.classList.add('invalid');
            if (isFeedback) {
                feedback.textContent = message || 'INVALID INPUT';
                feedback.className = 'feedback warning';
            }
        } else if (isValid === 'loading') {
            icon.classList.add('loading');
            if (isFeedback) {
                feedback.textContent = 'ANALYZING...';
                feedback.className = 'feedback';
                feedback.style.color = 'var(--amber)';
            }
        } else {
            if (isFeedback) feedback.textContent = '';
        }
        
        checkFormValidity();
    };

    // Password Entropy & UI Update
    const calculateEntropy = (pwd) => {
        let score = 0;
        const reqs = {
            length: pwd.length >= 12,
            upper: /[A-Z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[^A-Za-z0-9]/.test(pwd)
        };

        if (reqs.length) score += 25;
        if (reqs.upper) score += 25;
        if (reqs.number) score += 25;
        if (reqs.special) score += 25;

        // Update requirements UI
        document.getElementById('req-length').className = reqs.length ? 'met' : 'unmet';
        document.getElementById('req-upper').className = reqs.upper ? 'met' : 'unmet';
        document.getElementById('req-number').className = reqs.number ? 'met' : 'unmet';
        document.getElementById('req-special').className = reqs.special ? 'met' : 'unmet';

        return { score, reqs };
    };

    const updateEntropyUI = (score) => {
        entropyScoreText.textContent = `${score}%`;
        // stroke-dasharray max is 100
        entropyCircle.style.strokeDasharray = `${score}, 100`;
        
        if (score < 50) {
            entropyCircle.style.stroke = 'var(--red)';
            entropyStatus.textContent = 'VULNERABLE';
            entropyStatus.style.color = 'var(--red)';
        } else if (score < 100) {
            entropyCircle.style.stroke = 'var(--amber)';
            entropyStatus.textContent = 'MODERATE';
            entropyStatus.style.color = 'var(--amber)';
        } else {
            entropyCircle.style.stroke = 'var(--green)';
            entropyStatus.textContent = 'SECURE';
            entropyStatus.style.color = 'var(--green)';
        }
    };

    // Debounce function for API calls
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Server Validation Fetch
    const validateWithServer = async (field, value, inputElement) => {
        setInputState(inputElement, 'loading');
        try {
            const res = await fetch(`${API_URL}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field, value })
            });
            const data = await res.json();
            validationState[field] = data.valid;
            setInputState(inputElement, data.valid, data.message);
            addTerminalLog(`[VAL] ${field.toUpperCase()} CHECK: ${data.valid ? 'CLEARED' : 'FAILED'}`);
        } catch (err) {
            console.error(err);
            setInputState(inputElement, false, 'SERVER ERROR');
            validationState[field] = false;
        }
    };

    // Event Listeners

    usernameInput.addEventListener('input', debounce((e) => {
        const val = e.target.value.trim();
        if (val.length === 0) {
            setInputState(usernameInput, null);
            validationState.username = false;
            return;
        }
        validateWithServer('username', val, usernameInput);
    }, 800));

    emailInput.addEventListener('input', debounce((e) => {
        const val = e.target.value.trim();
        if (val.length === 0) {
            setInputState(emailInput, null);
            validationState.email = false;
            return;
        }
        validateWithServer('email', val, emailInput);
    }, 800));

    phoneInput.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val;
        if (val.length >= 10) {
            setInputState(phoneInput, true, 'LINK ESTABLISHED');
            validationState.phone = true;
            addTerminalLog(`[VAL] PHONE CHECK: CLEARED`);
        } else {
            setInputState(phoneInput, false, 'REQUIRES 10+ DIGITS');
            validationState.phone = false;
        }
    });

    pinInput.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val;
        if (val.length === 6) {
            setInputState(pinInput, true, 'PIN ACCEPTED');
            validationState.pin = true;
            addTerminalLog(`[VAL] PIN CHECK: CLEARED`);
        } else {
            setInputState(pinInput, false, '6 DIGITS REQUIRED');
            validationState.pin = false;
        }
        checkFormValidity();
    });

    passwordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const { score } = calculateEntropy(val);
        updateEntropyUI(score);
        
        if (score === 100) {
            setInputState(passwordInput, true, 'ENCRYPTION SECURE');
            validationState.password = true;
        } else {
            setInputState(passwordInput, false, 'ENCRYPTION WEAK');
            validationState.password = false;
        }

        // recheck confirm password if it has value
        if (confirmInput.value) {
            confirmInput.dispatchEvent(new Event('input'));
        }
    });

    confirmInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (!val) {
            setInputState(confirmInput, null);
            validationState.confirm = false;
        } else if (val === passwordInput.value && validationState.password) {
            setInputState(confirmInput, true, 'MATCH CONFIRMED');
            validationState.confirm = true;
        } else {
            setInputState(confirmInput, false, 'MISMATCH DETECTED');
            validationState.confirm = false;
        }
        checkFormValidity();
    });

    // Form Submittability Check
    const checkFormValidity = () => {
        const isValid = Object.values(validationState).every(v => v === true);
        submitBtn.disabled = !isValid;
    };

    // Toggle Password Visibility (Simulating Decryption)
    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            addTerminalLog(`[SYS] PASSWORD VISIBILITY TOGGLED`);
        });
    }

    // Identity Scan Modal (Submission Phase)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const overlay = document.getElementById('scan-overlay');
        const overlayStatus = document.getElementById('scan-status');
        const progressFill = document.querySelector('.progress-fill');
        
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('active'), 10);
        
        addTerminalLog('[SYS] INITIATING SECURE UPLOAD...', false);
        
        // Simulation phases
        const phases = [
            { width: '20%', text: 'Encrypting payload...' },
            { width: '50%', text: 'Establishing secure tunnel...' },
            { width: '80%', text: 'Awaiting server verification...' }
        ];
        
        let phaseIndex = 0;
        const phaseInterval = setInterval(() => {
            if (phaseIndex < phases.length) {
                progressFill.style.width = phases[phaseIndex].width;
                overlayStatus.textContent = phases[phaseIndex].text;
                addTerminalLog(`[SYS] ${phases[phaseIndex].text}`);
                phaseIndex++;
            }
        }, 850);

        // Actual API Call
        try {
            const formData = {
                username: usernameInput.value,
                email: emailInput.value,
                phone: phoneInput.value,
                pin: pinInput.value,
                password: passwordInput.value
            };
            
            const res = await fetch(`${API_URL}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            clearInterval(phaseInterval);
            
            progressFill.style.width = '100%';
            
            if (data.success) {
                // Populate ID Card Details
                document.getElementById('id-alias').textContent = formData.username;
                document.getElementById('id-email').textContent = formData.email;
                document.getElementById('id-token').textContent = data.token;
                document.getElementById('id-time').textContent = new Date().toLocaleTimeString();
                
                // Switch to ID Card View
                setTimeout(() => {
                    document.getElementById('scan-animation').classList.add('hidden');
                    document.getElementById('secure-id-card').classList.remove('hidden');
                    document.getElementById('scan-modal').style.borderColor = 'var(--green)';
                    addTerminalLog(`[AUTH] SUCCESS. TOKEN: ${data.token}`);
                    if(data.emailUrl) {
                        addTerminalLog(`[EMAIL] Preview Notification: ${data.emailUrl}`);
                    }
                }, 800);

                // Handle Close Button
                document.getElementById('close-modal-btn').onclick = () => {
                    overlay.classList.remove('active');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        document.getElementById('scan-animation').classList.remove('hidden');
                        document.getElementById('secure-id-card').classList.add('hidden');
                        document.getElementById('scan-modal').style.borderColor = 'rgba(var(--theme-primary-rgb), 0.3)';
                        form.reset();
                        Object.keys(validationState).forEach(k => validationState[k] = false);
                        document.querySelectorAll('.status-icon').forEach(i => i.className = 'status-icon');
                        document.querySelectorAll('.feedback').forEach(f => f.textContent = '');
                        updateEntropyUI(0);
                        checkFormValidity();
                        addTerminalLog(`[SYS] READY FOR NEXT IDENTITY.`);
                    }, 500);
                };
            } else {
                overlayStatus.textContent = 'ACCESS DENIED';
                overlayStatus.style.color = 'var(--red)';
                document.querySelector('.scan-modal h2').textContent = 'VERIFICATION FAILED';
                document.querySelector('.scan-modal').style.borderColor = 'var(--red)';
                addTerminalLog(`[AUTH] FAILED: ${data.message}`, true);
                
                setTimeout(() => {
                    overlay.classList.remove('active');
                    setTimeout(() => overlay.classList.add('hidden'), 500);
                }, 2000);
            }
        } catch (err) {
            clearInterval(phaseInterval);
            overlayStatus.textContent = 'SYSTEM FAILURE';
            overlayStatus.style.color = 'var(--red)';
            addTerminalLog(`[SYS] ERROR: ${err.message}`, true);
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.classList.add('hidden'), 500);
            }, 2000);
        }
    });

    // Initial log
    addTerminalLog('[SYS] AWAITING USER INPUT...');

    // Animated Matrix Background Logic
    const canvas = document.getElementById('mc');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Re-calculate drops on resize
        let cols = Math.floor(window.innerWidth / 20);
        let drops = Array(cols).fill(1);
        window.addEventListener('resize', () => {
            cols = Math.floor(window.innerWidth / 20);
            drops = Array(cols).fill(1);
        });

        const chars = '010101110010101NEXUSAUTHアイウエオカキクケコサシスセソタチツテト';
        
        const drawMatrix = () => {
            const bgRgb = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-rgb').trim() || '1, 8, 3';
            ctx.fillStyle = `rgba(${bgRgb}, 0.12)`; // Increased tail fade for smoother look
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#00FF88';
            ctx.fillStyle = primaryColor;
            ctx.font = '14px Orbitron, monospace';
            
            drops.forEach((y, i) => {
                const c = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(c, i * 20, y * 20);
                if (y * 20 > canvas.height && Math.random() > 0.98) { // Slower reset for more "rain" effect
                    drops[i] = 0;
                }
                drops[i]++;
            });
        };
        setInterval(drawMatrix, 50);
    }
});
