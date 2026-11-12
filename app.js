document.addEventListener('DOMContentLoaded', () => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storyViewport = window.matchMedia('(min-width: 761px) and (min-height: 700px)');
  let reduce = motionPreference.matches;
  const canObserve = 'IntersectionObserver' in window;
  const body = document.body;
  const root = document.documentElement;

  // 1. Scroll progress & Second Brain story-scroll
  const journey = document.querySelector('[data-journey]');
  const journeySticky = journey?.querySelector('.journey-sticky');
  const journeyVisual = journey?.querySelector('.journey-visual');
  const journeySteps = [...(journey?.querySelectorAll('.journey-step') || [])];
  const journeyStatus = document.getElementById('journey-status');
  const journeyIndex = document.getElementById('journey-index');
  const journeyLabel = document.getElementById('journey-label');
  const journeyProgress = journey?.querySelector('.journey-progress');
  const graphNodes = [...(journey?.querySelectorAll('.graph-node') || [])];
  const clamp = value => Math.min(1, Math.max(0, value));
  let activeScene = -1;

  const seg = (p, s, e) => clamp((p - s) / (e - s));
  const sm = t => t * t * (3 - 2 * t);
  const jq = s => journey?.querySelector(s);
  const jqa = s => [...(journey?.querySelectorAll(s) || [])];
  const docs = jqa('.doc'), edges = jqa('.graph-edge'), softEdges = jqa('.graph-edge-soft');
  const sProcess = jq('.scene-process'), sNet = jq('.scene-network'), sAnswer = jq('.scene-answer');
  const pPath = jq('.process-path'), trace = jq('.answer-trace'), photo = jq('.hub-photo');
  let jTarget = 0, jSmooth = 0, jRaf = 0;
  const docOffsets = docs.map(doc => {
    const style = getComputedStyle(doc);
    return {x: parseFloat(style.getPropertyValue('--dx')) || 0, y: parseFloat(style.getPropertyValue('--dy')) || 0};
  });

  const renderJourney = p => {
    const t1 = sm(seg(p, .08, .36));
    docs.forEach((d, i) => {
      d.style.transform = `translate(${t1 * docOffsets[i].x}px,${t1 * docOffsets[i].y}px) scale(${1 - t1 * .7})`;
      d.style.opacity = 1 - sm(seg(p, .22, .38));
    });
    const pin = sm(seg(p, .1, .24)), pout = sm(seg(p, .5, .62));
    sProcess.style.opacity = pin * (1 - pout);
    sProcess.style.transform = `scale(${.88 + .12 * pin - .25 * pout})`;
    pPath.style.strokeDashoffset = 1 - seg(p, .1, .36);
    sNet.style.opacity = sm(seg(p, .42, .52));
    edges.forEach((e, i) => e.style.strokeDashoffset = 1 - seg(p, .44 + i * .02, .62 + i * .02));
    softEdges.forEach(e => e.style.opacity = sm(seg(p, .6, .72)));
    photo.style.opacity = sm(seg(p, .48, .6));
    const dim = sm(seg(p, .74, .88));
    graphNodes.forEach((n, i) => {
      const reveal = sm(seg(p, .46 + i * .035, .58 + i * .035));
      n.style.opacity = reveal * (n.matches('.node-project,.node-rag') ? 1 : 1 - .62 * dim);
    });
    const ans = sm(seg(p, .74, .86));
    sAnswer.style.opacity = ans;
    sAnswer.style.transform = `translateY(${(1 - ans) * 26}px)`;
    trace.style.strokeDasharray = 1;
    trace.style.strokeDashoffset = 1 - seg(p, .78, .96);
    journeyProgress?.style.setProperty('--story-progress', p.toFixed(3));
    journeySticky.style.setProperty('--story-progress', p.toFixed(3));
    const sceneIndex = Math.min(3, Math.floor(p * 4));
    if (sceneIndex !== activeScene) {
      activeScene = sceneIndex;
      journeyIndex.textContent = '0' + (sceneIndex + 1);
      journeyProgress.setAttribute('aria-valuenow', String(sceneIndex + 1));
      journeyProgress.setAttribute('aria-valuetext', `Stage ${sceneIndex + 1} of 4: ${journeySteps[sceneIndex].dataset.label.toLowerCase()}`);
      journeyLabel.textContent = journeySteps[sceneIndex].dataset.label;
      journeySteps.forEach((st, i) => {
        if (i === sceneIndex) { st.setAttribute('aria-current', 'step'); st.removeAttribute('aria-hidden'); }
        else { st.removeAttribute('aria-current'); st.setAttribute('aria-hidden', 'true'); }
      });
      journeyStatus.textContent = journeySteps[sceneIndex].dataset.status;
    }
  };
  const jLoop = () => {
    jSmooth += (jTarget - jSmooth) * .09;
    if (Math.abs(jTarget - jSmooth) < .0004) jSmooth = jTarget;
    renderJourney(jSmooth);
    jRaf = jSmooth === jTarget ? 0 : requestAnimationFrame(jLoop);
  };
  const updateJourney = () => {
    if (!journey || !journeySticky || !journeyVisual || !root.classList.contains('story-scroll-ready')) return;
    const bounds = journey.getBoundingClientRect();
    if (bounds.top > window.innerHeight || bounds.bottom < 0) return;
    const range = journey.offsetHeight - journeySticky.offsetHeight;
    const stickyTop = parseFloat(getComputedStyle(journeySticky).top) || 0;
    jTarget = range > 0 ? clamp((stickyTop - bounds.top) / range) : 0;
    if (!jRaf) jRaf = requestAnimationFrame(jLoop);
  };

  const updateProgress = () => {
    const scrollable = root.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    root.style.setProperty('--scroll-progress', progress);
    if (!reduce) updateJourney();
  };

  let progressFrame = 0;
  const queueProgress = () => {
    if (!progressFrame) {
      progressFrame = requestAnimationFrame(() => {
        updateProgress();
        progressFrame = 0;
      });
    }
  };
  updateProgress();
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });

  if (!reduce) {
    root.classList.add('motion-ready');
    if (journey && storyViewport.matches) {
      root.classList.add('story-scroll-ready');
      updateJourney();
    }
    document.querySelectorAll('[data-stagger]').forEach(group => {
      [...group.children].filter(item => item.hasAttribute('data-reveal')).forEach((item, index) => {
        item.style.setProperty('--reveal-delay', Math.min(index * 80, 420) + 'ms');
      });
    });
    const revealTargets = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }), { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
      revealTargets.forEach(target => revealObserver.observe(target));
    } else {
      revealTargets.forEach(target => target.classList.add('is-visible'));
    }
  }

  // 2. Theme Toggle (System preference + Manual override saved in localStorage)
  const themeToggleBtn = document.getElementById('theme-toggle');
  let savedTheme;
  try { savedTheme = localStorage.getItem('mra-theme'); } catch { /* Use the system preference. */ }
  if (!['dark', 'light'].includes(savedTheme)) savedTheme = null;

  const setTheme = isDark => {
    root.classList.toggle('dark-mode', isDark);
    themeToggleBtn?.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  setTheme(savedTheme !== 'light');
  
  themeToggleBtn?.addEventListener('click', () => {
    const nextDark = !root.classList.contains('dark-mode');
    savedTheme = nextDark ? 'dark' : 'light';
    setTheme(nextDark);
    try { localStorage.setItem('mra-theme', savedTheme); } catch { /* Keep the choice for this visit. */ }
  });

  // 3. Responsive Navigation
  const menuButton = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  root.classList.add('nav-ready');
  const setMenuOpen = open => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', open);
  };
  menuButton?.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenuOpen(false);
  });
  nav?.addEventListener('focusout', event => {
    if (event.relatedTarget && !event.relatedTarget.closest('.site-header')) setMenuOpen(false);
  });
  window.matchMedia('(min-width: 1201px)').addEventListener('change', event => {
    if (event.matches) setMenuOpen(false);
  });

  // Typewriter telemetry (screen readers get the full text via a live twin)
  let typeRaf = 0;
  const flowPayloadSr = document.getElementById('flow-payload-sr');
  const typeText = (el, text) => {
    cancelAnimationFrame(typeRaf);
    if (flowPayloadSr) flowPayloadSr.textContent = text;
    if (reduce) { el.textContent = text; return; }
    const t0 = performance.now(), dur = Math.min(900, text.length * 14);
    const run = now => { const n = Math.ceil(Math.min(1, (now - t0) / dur) * text.length); el.textContent = text.slice(0, n); if (n < text.length) typeRaf = requestAnimationFrame(run); };
    typeRaf = requestAnimationFrame(run);
  };

  // 4. Multi-Scenario Interactive Workflow Simulator
  const WORKFLOW_SCENARIOS = {
    hms: {
      title: '5-Module Arabic Hospital Management System (Serverless n8n + Sheets)',
      note: 'end-to-end execution · zero traditional server required',
      times: [0.0, 0.3, 0.8, 1.4],
      steps: [
        { ico: 'UI', title: 'Arabic Portal Webhook', desc: 'Patient requests appointment slot via RTL HTML frontend', badge: 'POST /hms', payload: '{"module":"patient_portal","lang":"ar-JO","action":"book_slot"}' },
        { ico: 'n8n', title: '5-Module Router & Validation', desc: 'Routes across Doctor, Secretary & Patient workflow modules', badge: 'Validated', payload: '{"router":"n8n_hms_core","modules_synced":5,"status":"valid"}' },
        { ico: 'GS', title: 'Real-Time Google Sheets DB', desc: 'Checks doctor availability & locks time slot atomically', badge: 'Row #412', payload: '{"db":"google_sheets_live","slot":"14:30","conflict":false}' },
        { ico: 'OK', title: 'Automated Confirmation Sent', desc: 'Updates live clinic dashboard & confirms patient booking', badge: '200 OK', payload: '{"confirmed":true,"server_cost":"$0/mo","latency_ms":1400}' }
      ]
    },
    mcp: {
      title: 'Claude MCP Server + RAG Pipeline',
      note: 'illustrative grounded answer · context retrieval and tool calling',
      times: [0.0, 0.2, 0.7, 1.2],
      steps: [
        { ico: 'USR', title: 'Complex Multi-Step Prompt', desc: 'User asks Aria AI to analyze docs & schedule follow-up tasks', badge: 'Query', payload: '{"agent":"aria_ai","intent":"doc_rag_and_task_sync"}' },
        { ico: 'RTR', title: 'Smart Model Router & Cache', desc: 'Applies prompt caching & selects optimal Claude/OpenAI tier', badge: 'Cache Hit', payload: '{"cache_hit":true,"model_tier":"sonnet_cached"}' },
        { ico: 'MCP', title: 'MCP Tool & Vector RAG Call', desc: 'Retrieves custom document chunks & invokes Python MCP tool', badge: '3 Sources', payload: '{"protocol":"MCP","rag_chunks":3,"confidence":0.96}' },
        { ico: 'AI', title: 'Grounded Action & Reply', desc: 'Delivers cited response & updates calendar/task modules', badge: 'Completed', payload: '{"citations":3,"tasks_created":2}' }
      ]
    },
    retail: {
      title: 'Stateful AI Assistant for a Computer Retailer (n8n + Gemini + Sheets)',
      note: 'from customer message to custom quote · no human in the loop',
      times: [0.0, 0.4, 1.1, 1.9],
      steps: [
        { ico: 'WA', title: 'Message Received', desc: 'Customer asks for a gaming PC build under $900', badge: 'Webhook', payload: '{"channel":"whatsapp","budget_usd":900,"category":"gaming_pc"}' },
        { ico: 'AI', title: 'Agent Extracts Intent', desc: 'LLM parses budget, specs & conversation memory', badge: 'Memory', payload: '{"llm":"gemini_pro","session_memory":true,"gpu_tier":"mid_high"}' },
        { ico: 'GS', title: 'Live Stock Checked', desc: 'Google Sheets API returns compatible parts in stock', badge: 'In Stock', payload: '{"sheets_query":"parts_inventory","matched_components":6}' },
        { ico: 'OK', title: 'Reply & Email Quote Sent', desc: 'Formatted PDF/HTML quote sent to customer via Gmail', badge: 'Sent', payload: '{"gmail_sent":true,"quote_total":"$875","human_touch":0}' }
      ]
    }
  };

  const flowNodes = [...document.querySelectorAll('#flow .node')];
  const flowTabs = [...document.querySelectorAll('.flow-tab')];
  const flowTitle = document.getElementById('flow-title');
  const flowTimerEl = document.getElementById('flow-time');
  const flowMetricNote = document.getElementById('flow-metric-note');
  const flowPayloadEl = document.getElementById('flow-payload');
  const flowToggleBtn = document.getElementById('flow-toggle');
  const flowToggleLabel = document.getElementById('flow-toggle-label');

  let currentScenarioKey = 'hms';
  let step = 0;
  let flowInView = false;
  let flowPaused = reduce;
  const flowStatus = document.getElementById('flow-status');
  let flowTimer = null;

  function renderScenario(key) {
    const scenario = WORKFLOW_SCENARIOS[key];
    if (!scenario) return;
    currentScenarioKey = key;
    flowTitle.textContent = scenario.title;
    flowMetricNote.textContent = scenario.note;
    flowNodes.forEach((node, idx) => {
      const s = scenario.steps[idx];
      if (!s) return;
      node.querySelector('.n-ico').textContent = s.ico;
      node.querySelector('.n-text b').textContent = s.title;
      node.querySelector('.n-text small').textContent = s.desc;
      const badge = node.querySelector('.n-badge');
      if (badge) badge.textContent = s.badge;
    });
    step = 0;
    paintFlow();
  }

  function paintFlow() {
    const scenario = WORKFLOW_SCENARIOS[currentScenarioKey];
    flowNodes.forEach((n, i) => {
      n.classList.toggle('is-active', i === step);
      n.classList.toggle('is-done', i < step);
      n.querySelector('button').setAttribute('aria-pressed', String(i === step));
    });
    if (scenario) {
      flowTimerEl.textContent = scenario.times[step].toFixed(1) + 's';
      if (flowPayloadEl && scenario.steps[step]) {
        typeText(flowPayloadEl, scenario.steps[step].payload);
      }
    }
  }

  const syncFlowControl = () => {
    flowToggleBtn.classList.toggle('is-paused', flowPaused);
    flowToggleBtn.closest('.flow').classList.toggle('is-paused', flowPaused || !flowInView || document.hidden);
    flowToggleBtn.setAttribute('aria-pressed', String(flowPaused));
    flowToggleBtn.setAttribute('aria-label', flowPaused ? 'Play workflow simulation' : 'Pause workflow simulation');
    flowToggleLabel.textContent = flowPaused ? 'PAUSED' : 'PLAYING';
  };
  const updateFlowPlayback = () => {
    clearInterval(flowTimer);
    flowTimer = null;
    syncFlowControl();
    if (!flowInView || document.hidden || flowPaused) return;
    flowTimer = setInterval(() => {
      step = (step + 1) % flowNodes.length;
      paintFlow();
    }, 2400);
  };
  const announceStep = () => {
    flowStatus.textContent = `Step ${step + 1} of ${flowNodes.length}: ${WORKFLOW_SCENARIOS[currentScenarioKey].steps[step].title}`;
  };
  flowTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      flowTabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-pressed', String(active));
      });
      renderScenario(tab.dataset.scenario);
      announceStep();
      updateFlowPlayback();
    });
  });
  flowNodes.forEach((node, idx) => {
    node.querySelector('button').addEventListener('click', () => {
      step = idx;
      flowPaused = true;
      paintFlow();
      announceStep();
      updateFlowPlayback();
    });
  });
  flowToggleBtn?.addEventListener('click', () => {
    flowPaused = !flowPaused;
    updateFlowPlayback();
  });
  paintFlow();
  if (canObserve) {
    const flowObserver = new IntersectionObserver(([entry]) => {
      flowInView = entry.isIntersecting;
      updateFlowPlayback();
    }, {threshold: 0.2});
    flowObserver.observe(document.getElementById('flow'));
  } else {
    flowInView = true;
  }
  updateFlowPlayback();
  document.addEventListener('visibilitychange', updateFlowPlayback);
  window.addEventListener('pagehide', () => { clearInterval(flowTimer); cancelAnimationFrame(typeRaf); });
  window.addEventListener('pageshow', updateFlowPlayback);

  // 5. Project Filter, Keyword Search & Expand/Collapse All
  const chips = document.querySelectorAll('.chip');
  const projects = [...document.querySelectorAll('.project')];
  const projectCount = document.getElementById('project-count');
  const projectSearch = document.getElementById('project-search');
  const toggleAllBtn = document.getElementById('toggle-all-projects');
  let activeFilter = 'all';
  const projectEmpty = document.getElementById('project-empty');
  const searchableProjects = new Map(projects.map(project => [project, project.textContent.toLowerCase()]));
  const syncExpandButton = () => {
    const visible = projects.filter(project => !project.hidden);
    const expanded = visible.length > 0 && visible.every(project => project._a ? project._want : project.open);
    toggleAllBtn.textContent = expanded ? 'Collapse all details' : 'Expand all details';
    toggleAllBtn.disabled = visible.length === 0;
  };

  const filterProjects = () => {
    const query = (projectSearch?.value || '').trim().toLowerCase();
    let visibleCount = 0;
    projects.forEach(p => {
      const cats = p.dataset.category.split(' ');
      const matchesChip = activeFilter === 'all' || cats.includes(activeFilter);
      const matchesQuery = !query || searchableProjects.get(p).includes(query);
      const show = matchesChip && matchesQuery;
      p.hidden = !show;
      if (show) visibleCount++;
    });
    if (projectCount) {
      projectCount.textContent = visibleCount + (visibleCount === 1 ? ' project' : ' projects');
    }
    projectEmpty.hidden = visibleCount !== 0;
    syncExpandButton();
  };

  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => {
      const selected = c === chip;
      c.classList.toggle('is-on', selected);
      c.setAttribute('aria-pressed', String(selected));
    });
    activeFilter = chip.dataset.filter;
    filterProjects();
  }));

  projectSearch?.addEventListener('input', filterProjects);

  toggleAllBtn?.addEventListener('click', () => {
    const visible = projects.filter(project => !project.hidden);
    const expand = !visible.every(project => project._a ? project._want : project.open);
    visible.forEach(project => slide(project, expand));
    syncExpandButton();
  });
  projects.forEach(project => project.addEventListener('toggle', syncExpandButton));
  document.getElementById('reset-projects').addEventListener('click', () => {
    projectSearch.value = '';
    chips[0].click();
    projectSearch.focus();
  });
  filterProjects();

  // 6. Interactive ROI & LLM Cost Savings Calculator
  const roiHoursInput = document.getElementById('roi-hours');
  const roiRateInput = document.getElementById('roi-rate');
  const roiApiInput = document.getElementById('roi-api');
  const roiHoursVal = document.getElementById('roi-hours-val');
  const roiRateVal = document.getElementById('roi-rate-val');
  const roiApiVal = document.getElementById('roi-api-val');
  const resHours = document.getElementById('res-hours');
  const resApi = document.getElementById('res-api');
  const resTotal = document.getElementById('res-total');
  const roiBookBtn = document.getElementById('roi-book-btn');

  const updateROI = () => {
    if (!roiHoursInput || !roiRateInput || !roiApiInput) return;
    const weeklyHours = Number(roiHoursInput.value);
    const hourlyRate = Number(roiRateInput.value);
    const monthlyApi = Number(roiApiInput.value);

    roiHoursVal.textContent = `${weeklyHours} hrs/wk`;
    roiRateVal.textContent = `$${hourlyRate} / hr`;
    roiApiVal.textContent = `$${monthlyApi} / mo`;

    const savings = PortfolioCore.calculateSavings(weeklyHours, hourlyRate, monthlyApi);
    const money = value => value.toLocaleString('en-US');
    resHours.textContent = `${savings.monthlyHours} hrs`;
    resApi.textContent = `$${money(savings.annualApi)}`;
    resTotal.textContent = `$${money(savings.total)} / yr`;
    roiHoursInput.setAttribute('aria-valuetext', `${weeklyHours} hours per week`);
    roiRateInput.setAttribute('aria-valuetext', `${hourlyRate} US dollars per hour`);
    roiApiInput.setAttribute('aria-valuetext', `${monthlyApi} US dollars per month`);
  };

  [roiHoursInput, roiRateInput, roiApiInput].forEach(inp => inp?.addEventListener('input', updateROI));
  updateROI();
  [roiHoursInput, roiRateInput, roiApiInput, roiBookBtn].forEach(control => { control.disabled = false; });

  roiBookBtn?.addEventListener('click', () => {
    const subj = document.getElementById('form-subject');
    const msg = document.getElementById('form-message');
    if (subj && msg) {
      if (!subj.value.trim()) {
        subj.value = 'Workflow & LLM Cost Optimization Audit';
        subj.dispatchEvent(new Event('input', {bubbles: true}));
      }
      const estimate = `ROI estimate: ${roiHoursVal.textContent} manual work at ${roiRateVal.textContent}, ${roiApiVal.textContent} API spend; estimated ${resTotal.textContent} gross annual value.`;
      if (!msg.value.includes(estimate)) {
        const combined = msg.value.trim() ? `${msg.value.trim()}\n\n${estimate}` : `Hi Mohammad, I'd like to discuss automating our workflows.\n\n${estimate}`;
        if (combined.length <= msg.maxLength) {
          msg.value = combined;
          msg.dispatchEvent(new Event('input', {bubbles: true}));
        }
        else say('Your existing message is preserved. Shorten it to add the estimate, or include the figures manually.', 'error');
      }
      syncTopics();
    }
    document.getElementById('contact')?.scrollIntoView({behavior: reduce ? 'instant' : 'smooth'});
    document.getElementById('form-name')?.focus({preventScroll: true});
  });

  // 7. Topic and project links deliberately update the subject, preserving the message.
  const topicPills = document.querySelectorAll('.topic-pill');
  const subjectInput = document.getElementById('form-subject');
  const syncTopics = () => topicPills.forEach(pill => {
    const selected = pill.dataset.topic === subjectInput.value;
    pill.classList.toggle('is-selected', selected);
    pill.setAttribute('aria-pressed', String(selected));
  });
  topicPills.forEach(pill => pill.addEventListener('click', () => {
    subjectInput.value = pill.dataset.topic;
    subjectInput.dispatchEvent(new Event('input', {bubbles: true}));
  }));
  subjectInput.addEventListener('input', syncTopics);
  document.querySelectorAll('[data-prefill]').forEach(link => link.addEventListener('click', () => {
    subjectInput.value = link.dataset.prefill;
    subjectInput.dispatchEvent(new Event('input', {bubbles: true}));
  }));

  // 8. ATS CV Modal & Print Handler
  const cvModal = document.getElementById('cv-modal');
  const closeCvBtn = document.getElementById('close-cv-btn');
  const printCvBtn = document.getElementById('print-cv-btn');
  const openCvTriggers = document.querySelectorAll('#open-cv-btn, [data-open-cv]');

  let cvTrigger = null;
  let previousOverflow = '';
  const setCvModalOpen = open => {
    if (open && !cvModal.open) {
      cvTrigger = document.activeElement;
      previousOverflow = body.style.overflow;
      cvModal.showModal();
      body.style.overflow = 'hidden';
      closeCvBtn.focus();
    } else if (!open && cvModal.open) {
      cvModal.close();
    }
  };
  openCvTriggers.forEach(trigger => trigger.addEventListener('click', () => setCvModalOpen(true)));
  closeCvBtn.addEventListener('click', () => setCvModalOpen(false));
  cvModal.addEventListener('click', event => {
    if (event.target === cvModal) setCvModalOpen(false);
  });
  cvModal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...cvModal.querySelectorAll('button, a[href], [tabindex="0"]')].filter(control => control.getClientRects().length && !control.disabled);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  cvModal.addEventListener('close', () => {
    body.style.overflow = previousOverflow;
    cvTrigger?.focus({preventScroll: true});
  });
  printCvBtn.addEventListener('click', () => {
    body.classList.add('printing-cv');
    window.print();
  });
  window.addEventListener('afterprint', () => body.classList.remove('printing-cv'));

  // 9. Contact composer: validate, retain the draft, then hand off for user review.
  const WHATSAPP = '962775296594';
  const EMAIL = 'mohammad05raedalmothker@gmail.com';
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-form-status');
  const emailBtn = document.getElementById('form-email-button');
  const handoff = document.getElementById('contact-handoff');
  const say = (message, type) => {
    status.textContent = message;
    status.className = 'form-status ' + type;
  };
  const fields = ['name', 'email', 'subject', 'message'].map(key => document.getElementById(`form-${key}`));
  fields.forEach(field => field.addEventListener('input', () => {
    field.removeAttribute('aria-invalid');
    status.textContent = '';
    status.className = 'form-status';
    handoff.hidden = true;
    handoff.removeAttribute('href');
  }));
  const getFormValues = () => {
    const data = {};
    let firstInvalid;
    fields.forEach(field => {
      const value = field.value.trim();
      const invalid = (field.required && !value) || !field.validity.valid || value.length > field.maxLength;
      field.setAttribute('aria-invalid', String(invalid));
      if (invalid && !firstInvalid) firstInvalid = field;
      data[field.name] = value;
    });
    if (firstInvalid) {
      const message = firstInvalid.type === 'email' && firstInvalid.value.trim()
        ? 'Enter a valid email address, for example name@company.com.'
        : `Check ${firstInvalid.name === 'message' ? 'your message' : `the ${firstInvalid.name} field`}. Required fields cannot be blank; keep within the text limit.`;
      say(message, 'error');
      firstInvalid.focus();
      return null;
    }
    return data;
  };
  const prepareHandoff = channel => {
    const data = getFormValues();
    if (!data) return null;
    const url = PortfolioCore.contactLinks(data, WHATSAPP, EMAIL)[channel];
    handoff.href = url;
    handoff.textContent = channel === 'whatsapp' ? 'Open prepared WhatsApp message ↗' : 'Open prepared email ↗';
    handoff.hidden = false;
    return url;
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    const url = prepareHandoff('whatsapp');
    if (!url) return;
    // Keep this synchronous with the user gesture; noopener may return null even on success.
    window.open(url, '_blank', 'noopener,noreferrer');
    say('Your message is ready. Review and send it in WhatsApp. If no tab opened, use the prepared message link. Your draft is kept here.', 'success');
  });
  emailBtn.addEventListener('click', () => {
    const url = prepareHandoff('email');
    if (!url) return;
    window.location.href = url;
    say('Your email draft is ready. Review and send it in your email app. If it did not open, use the prepared email link or the direct address.', 'success');
  });
  document.getElementById('contact-fields').disabled = false;
  // ===== Motion layer =====
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const hero = document.querySelector('.hero');

  // Smooth accordion (height + fade) for project details
  function slide(details, open) {
    const panel = details.querySelector('.p-body');
    details._want = open;
    if (details._a) {
      details._a.oncancel = null;
      details._a.cancel();
      details._a = null;
      panel.style.overflow = '';
    }
    if (reduce || !panel || !panel.animate || details.open === open) {
      details.open = open;
      syncExpandButton();
      return;
    }
    if (open) details.open = true;
    const height = panel.offsetHeight;
    const padding = getComputedStyle(panel).paddingBottom;
    panel.style.overflow = 'hidden';
    const frames = [{height: '0px', paddingBottom: '0px', opacity: 0}, {height: `${height}px`, paddingBottom: padding, opacity: 1}];
    const animation = details._a = panel.animate(open ? frames : frames.reverse(), {duration: open ? 360 : 240, easing: 'cubic-bezier(.2,.7,.2,1)'});
    const clean = () => { panel.style.overflow = ''; details._a = null; };
    animation.oncancel = clean;
    animation.onfinish = () => { details.open = open; clean(); syncExpandButton(); };
  }

  // Scroll-spy with a sliding amber indicator
  const navLinks = [...document.querySelectorAll('#site-nav a')];
  const indicator = document.querySelector('.nav-indicator');
  const place = a => {
    if (!indicator) return;
    indicator.style.opacity = a ? '1' : '0';
    if (a) { indicator.style.width = a.offsetWidth + 'px'; indicator.style.transform = `translateX(${a.offsetLeft}px)`; }
  };
  const spy = canObserve ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const a = navLinks.find(l => l.getAttribute('href') === '#' + e.target.id);
    navLinks.forEach(l => l.removeAttribute('aria-current'));
    a?.setAttribute('aria-current', 'location');
    place(a);
  }), { rootMargin: '-25% 0px -60% 0px' }) : null;
  navLinks.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy?.observe(s); });
  window.addEventListener('resize', () => place(navLinks.find(l => l.hasAttribute('aria-current'))));

  if (!reduce && canObserve) {
    // Mask-rise word splitting (headline, section titles, story steps)
    const split = el => {
      let i = 0;
      const walk = node => [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(' '); return; }
            const w = document.createElement('span'), s = document.createElement('span');
            w.className = 'w'; s.textContent = t; s.style.setProperty('--i', i++);
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
      walk(el); el.classList.add('split');
    };
    document.querySelectorAll('.sec-head h2,.brain h2').forEach(split);
    root.classList.add('split-ready');
    document.querySelectorAll('[data-reveal]').forEach(r => r.querySelector('h2.split') && r.setAttribute('data-reveal-split', ''));
    document.querySelectorAll('.hero-badges span').forEach((s, i) => s.style.setProperty('--c', i));
    document.querySelectorAll('.flow .node').forEach((s, i) => s.style.setProperty('--c', i));

    // Metric count-up
    document.querySelectorAll('.metric-value').forEach(el => {
      const m = el.textContent.trim().match(/^(\D*)(\d+)(.*)$/);
      if (!m) return;
      const [, pre, num, suf] = m;
      el.textContent = pre + '0' + suf;
      new IntersectionObserver((es, o) => es.forEach(e => {
        if (!e.isIntersecting) return;
        o.disconnect();
        const t0 = performance.now();
        const tick = now => { const p = reduce ? 1 : Math.min(1, (now - t0) / 1400); el.textContent = pre + Math.round(ease(p) * +num) + suf; if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }), { threshold: .6 }).observe(el);
    });

    // Process line draw
    const stepsEl = document.querySelector('.steps');
    if (stepsEl && canObserve) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { stepsEl.classList.add('is-drawn'); o.disconnect(); } }), { threshold: .3 }).observe(stepsEl);

    // Pause the lattice when the hero is off-screen
    const lat = hero?.querySelector('.hero-lattice svg');
    if (hero && lat && canObserve) new IntersectionObserver(([e]) => {
      hero.classList.toggle('is-away', !e.isIntersecting);
      e.isIntersecting && !reduce ? lat.unpauseAnimations?.() : lat.pauseAnimations?.();
    }).observe(hero);

    // Accordion interception
    document.querySelectorAll('.project summary').forEach(s => s.addEventListener('click', e => {
      e.preventDefault();
      const d = s.parentElement;
      slide(d, d._a ? !d._want : !d.open);
    }));

    if (fine) {
      // Cursor spotlight on cards
      document.querySelectorAll('.metric-card,.flow,.roi-kpi,.stack:not(.learning-card),.about-intro,.career>li').forEach(el => {
        el.setAttribute('data-spot', '');
        el.addEventListener('pointermove', e => { if (reduce) return; const r = el.getBoundingClientRect(); el.style.setProperty('--sx', e.clientX - r.left + 'px'); el.style.setProperty('--sy', e.clientY - r.top + 'px'); });
      });
      // Magnetic buttons
      document.querySelectorAll('.unused-magnetic-button').forEach(b => {
        b.addEventListener('pointermove', e => { if (reduce) return; const r = b.getBoundingClientRect(); b.style.translate = (e.clientX - r.left - r.width / 2) * .18 + 'px ' + (e.clientY - r.top - r.height / 2) * .28 + 'px'; });
        b.addEventListener('pointerleave', () => { b.style.translate = ''; });
      });
      // Lattice parallax
      hero?.addEventListener('pointermove', e => { if (reduce) return; const r = hero.getBoundingClientRect(); hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3)); hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
    }
  }

  const syncMotion = () => {
    reduce = motionPreference.matches;
    const storyEnabled = !reduce && storyViewport.matches;
    root.classList.toggle('story-scroll-ready', storyEnabled);
    cancelAnimationFrame(jRaf);
    jRaf = 0;
    activeScene = -1;
    if (storyEnabled) updateJourney();
    else {
      journeySteps.forEach(step => {
        step.removeAttribute('aria-current');
        step.removeAttribute('aria-hidden');
      });
      journeyIndex.textContent = '01–04';
      journeyLabel.textContent = 'THE KNOWLEDGE PIPELINE';
      journeyStatus.textContent = '';
    }
    document.querySelectorAll('svg').forEach(svg => {
      if (reduce || svg.closest('.hero.is-away')) svg.pauseAnimations?.();
      else svg.unpauseAnimations?.();
    });
    if (reduce) {
      flowPaused = true;
      cancelAnimationFrame(typeRaf);
      paintFlow();
      root.classList.remove('motion-ready');
      projects.forEach(project => {
        if (project._a) slide(project, project._want);
      });
      document.querySelectorAll('.btn').forEach(button => { button.style.translate = ''; });
    }
    updateFlowPlayback();
  };
  motionPreference.addEventListener('change', syncMotion);
  storyViewport.addEventListener('change', syncMotion);
  syncMotion();

});
