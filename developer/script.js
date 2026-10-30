
(function () {
    var root = document.getElementById('vs-home');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Tech stack chips
    var tech = [['C++', 'C++', '#00599c'], ['JS', 'JavaScript', '#d6a900'], ['Re', 'React', '#0aa4c9'], ['No', 'Node.js', '#3c873a'], ['Ex', 'Express.js', '#555'], ['Mo', 'MongoDB', '#13aa52'],
    ['SQL', 'MySQL', '#00758f'], ['5', 'HTML5', '#e34f26'], ['3', 'CSS3', '#1572b6'], ['Git', 'Git', '#f05032'], ['GH', 'GitHub', '#6e40c9'], ['VS', 'VS Code', '#007acc']];
    document.getElementById('vsTech').innerHTML = tech.map(function (t) {
        return '<div class="vs-t vs-rv" style="--c:' + t[2] + '"><i>' + t[0] + '</i>' + t[1] + '</div>';
    }).join('');

    // Typing effect
    var role = document.getElementById('vsRole'), txt = '> Full Stack Web Developer & Competitive Programmer', n = 0;
    if (reduce) role.textContent = txt;
    else (function type() { role.textContent = txt.slice(0, ++n); if (n < txt.length) setTimeout(type, 50); })();

    // Scroll reveal, code lines and counters
    function count(el) {
        var end = +el.dataset.n, t0 = null;
        if (reduce) { el.textContent = end; return; }
        requestAnimationFrame(function step(t) {
            t0 = t0 || t; var p = Math.min((t - t0) / 1400, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        });
    }
    var els = root.querySelectorAll('.vs-rv, #vsCode');
    function show(el) {
        el.classList.add('on');
        el.querySelectorAll && el.querySelectorAll('[data-n]').forEach(count);
    }
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
        }, { threshold: 0.15 });
        els.forEach(function (el, i) { if (el.classList.contains('vs-t')) el.style.transitionDelay = (i % 6) * 0.07 + 's'; io.observe(el); });
    } else els.forEach(show);

    // Theme + mobile menu
    var themeBtn = document.getElementById('vsTheme'), menu = document.getElementById('vsMenu');
    themeBtn.addEventListener('click', function () {
        var light = root.classList.toggle('light'); themeBtn.textContent = light ? '☀' : '☾';
    });
    document.getElementById('vsBurger').addEventListener('click', function () { menu.classList.toggle('open'); });
    menu.addEventListener('click', function () { menu.classList.remove('open'); });

    // Photo tilt on desktop
    var box = document.getElementById('vsPhoto'), pic = document.getElementById('vsPic');
    if (!reduce && window.matchMedia('(hover:hover)').matches) {
        box.addEventListener('mousemove', function (e) {
            var r = box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            pic.style.transform = 'rotateY(' + x * 20 + 'deg) rotateX(' + -y * 20 + 'deg) scale(1.04)';
        });
        box.addEventListener('mouseleave', function () { pic.style.transform = ''; });
    }
})();