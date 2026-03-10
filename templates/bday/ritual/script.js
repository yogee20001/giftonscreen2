<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<script data-purpose="ritual-logic">
        document.addEventListener('DOMContentLoaded', () => {
            const tool = document.getElementById('ritual-tool');
            const candleImg = document.getElementById('candle-img');
            const candleGlow = document.getElementById('candle-glow');
            const candleContainer = document.getElementById('candle-container');
            const cakeLeft = document.getElementById('cake-left');
            const cakeRight = document.getElementById('cake-right');
            const finalReveal = document.getElementById('final-reveal');

            let ritualStarted = false;

            tool.addEventListener('click', () => {
                if (ritualStarted) return;
                ritualStarted = true;

                // 1. Light the candle (glow effect)
                candleImg.classList.add('candle-lit');
                candleGlow.classList.remove('opacity-0');
                candleGlow.classList.add('opacity-100');

                tool.parentElement.style.opacity = '0';
                tool.parentElement.style.pointerEvents = 'none';

                // 2. Pause for effect
                setTimeout(() => {
                    // 3. Candle and glow fade out
                    candleContainer.style.opacity = '0';

                    // 4. Cake splits apart
                    setTimeout(() => {
                        cakeLeft.classList.add('cake-split-left');
                        cakeRight.classList.add('cake-split-right');

                        // 5. Reveal the content
                        finalReveal.classList.remove('opacity-0');
                        finalReveal.classList.add('opacity-100');
                    }, 800);
                }, 1500);
            });
        });
    </script>