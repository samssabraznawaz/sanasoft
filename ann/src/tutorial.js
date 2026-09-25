// ═══════════════════════════════════════════════════════════════════
// TUTORIAL — SPSS to SaNaSoft-ANN (Leong et al., 2025)
// ═══════════════════════════════════════════════════════════════════
const TUT_STEPS = [
  // ─── Step 1: Open SPSS MLP ───────────────────────────────────────
  {
    label:'1. Open MLP',
    title:'Step 1: Opening the MLP Procedure in SPSS',
    sub:'In SPSS, the Neural Network MLP wizard is accessed from the menu bar. In SaNaSoft-ANN, the analysis begins directly when you launch the application — no menu navigation needed.',
    spssTitle:'SPSS Statistics — Multilayer Perceptron',
    spssTabsHtml:``,
    spssContentHtml:`
      <div style="padding:12px;font-size:12px">
        <div style="margin-bottom:10px;font-weight:700;color:#1565c0">IBM SPSS Statistics 29 — Menu Navigation</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">
          <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;padding:4px 10px;font-weight:700;font-size:11px">Analyze</div>
          <div style="font-size:16px;color:#999;align-self:center">›</div>
          <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;padding:4px 10px;font-size:11px">Neural Networks</div>
          <div style="font-size:16px;color:#999;align-self:center">›</div>
          <div style="background:#1565c0;color:#fff;border-radius:4px;padding:4px 10px;font-weight:700;font-size:11px">Multilayer Perceptron…</div>
        </div>
        <div style="background:#fff3e0;border:1px solid #ffcc80;border-radius:6px;padding:10px;margin-top:8px">
          <div style="font-weight:700;font-size:11px;margin-bottom:4px">💡 Before opening MLP in SPSS:</div>
          <div style="font-size:11px;line-height:1.6">1. Data must be open in the Data Editor<br>2. Variable types must be correctly set (Scale = continuous)<br>3. Ensure no system-missing values (or handle them first)</div>
        </div>
        <div style="background:#ffebee;border:1px solid #ef9a9a;border-radius:6px;padding:10px;margin-top:8px">
          <div style="font-weight:700;font-size:11px;color:#c62828;margin-bottom:3px">⚠️ SPSS Requirement:</div>
          <div style="font-size:11px">SPSS Statistics with Neural Networks add-on module must be licensed.</div>
        </div>
      </div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">1</span> <div><strong>SaNaSoft-ANN replaces this step entirely.</strong> Simply open the <code>SaNaSoft-ANN.html</code> file in any web browser. The application loads instantly — no SPSS license, no installation, no menu navigation.</div></div>
      <div style="background:#e8f5e9;border-radius:8px;padding:12px;font-size:12px;margin-top:10px">
        <strong style="color:#2e7d32">✅ SaNaSoft-ANN Advantages:</strong>
        <ul style="margin-top:6px;padding-left:18px;line-height:1.8;color:#1b5e20">
          <li>100% free — no SPSS license needed</li>
          <li>Runs entirely in your browser (data stays private)</li>
          <li>Works on Windows, Mac, Linux, and iPad</li>
          <li>Built-in high-speed neural engine (runs in a background thread; a full 10-network analysis takes seconds)</li>
          <li>Guided wizard interface designed for social science researchers</li>
        </ul>
      </div>`,
    keyPoint:'Leong et al. (2025) recommend MLP (Multilayer Perceptron) — not RBF — for PLS-SEM + ANN hybrid research. SaNaSoft-ANN implements MLP by default.',
    warning:''
  },

  // ─── Step 2: Variables Tab ────────────────────────────────────────
  {
    label:'2. Variables',
    title:'Step 2: Assigning Variables (SPSS Variables Tab → SaNaSoft Step 2)',
    sub:'In SPSS, you drag variables from the left panel into the Dependent and Covariate boxes. SaNaSoft-ANN uses the same drag-and-assign concept in a researcher-friendly interface.',
    spssTitle:'Multilayer Perceptron — Variables',
    spssTabsHtml:`<div class="spss-tab active">Variables</div><div class="spss-tab">Partitions</div><div class="spss-tab">Architecture</div><div class="spss-tab">Training</div><div class="spss-tab">Output</div><div class="spss-tab">Save</div><div class="spss-tab">Export</div>`,
    spssContentHtml:`
      <div style="display:grid;grid-template-columns:1fr 36px 1fr 36px 1fr;gap:6px;align-items:start;padding:6px 4px">
        <div>
          <div style="font-size:10px;font-weight:700;margin-bottom:3px;color:#333">Variables:</div>
          <div class="spss-listbox">
            <div>SocialNorm [Scale]</div>
            <div>Attitude [Scale]</div>
            <div class="sel">UseIntention [Scale]</div>
            <div>UserBehavior [Scale]</div>
            <div>ValueBelief [Scale]</div>
            <div>RiskBelief [Scale]</div>
            <div>TrustBelief [Scale]</div>
          </div>
        </div>
        <div class="spss-transfer" style="padding-top:20px">
          <button>►</button>
          <button style="margin-top:2px;font-size:8px;color:#999">◄</button>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;margin-bottom:3px;color:#333">Dependent Variable:</div>
          <div class="spss-listbox" style="height:36px"><div class="sel">UseIntention [Scale]</div></div>
          <div style="font-size:10px;font-weight:700;margin:6px 0 3px;color:#333">Covariates:</div>
          <div class="spss-listbox" style="height:64px">
            <div class="sel">UserBehavior [Scale]</div>
            <div class="sel">ValueBelief [Scale]</div>
            <div class="sel">RiskBelief [Scale]</div>
            <div class="sel">TrustBelief [Scale]</div>
            <div class="sel">SocialNorm [Scale]</div>
          </div>
          <div style="font-size:10px;font-weight:700;margin:6px 0 3px;color:#333">Factors (optional):</div>
          <div class="spss-listbox" style="height:24px"></div>
        </div>
        <div></div>
        <div>
          <div style="font-size:10px;font-weight:700;margin-bottom:3px;color:#333">Rescaling of Covariates:</div>
          <select style="font-size:10px;width:100%;border:1px solid #999;padding:2px;pointer-events:none"><option>Standardized</option></select>
        </div>
      </div>
      <div class="spss-btn-row"><button class="spss-btn primary">OK</button><button class="spss-btn">Paste</button><button class="spss-btn">Reset</button><button class="spss-btn">Cancel</button><button class="spss-btn">Help</button></div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">2</span> <div><strong>SaNaSoft-ANN Step 2: Variables</strong> — same concept, cleaner interface</div></div>
      <div style="font-size:12px;line-height:1.7;color:#374151">
        <div style="background:#e8eaf6;border-radius:8px;padding:10px;margin-bottom:8px">
          <strong>How to assign variables in SaNaSoft:</strong>
          <ol style="margin-top:6px;padding-left:18px">
            <li>After importing data, variable names appear in an <em>Available Variables</em> pool</li>
            <li>Click a variable to assign it as <strong>Dependent Variable</strong> (the outcome/criterion)</li>
            <li>Drag remaining variables into the <strong>Covariates</strong> box (continuous predictors)</li>
            <li>Categorical variables (if any) go into <strong>Factors</strong></li>
            <li>Set <strong>Rescaling</strong> — keep <em>Standardized</em> (Leong et al. recommendation)</li>
          </ol>
        </div>
        <div style="background:#fff3e0;border-radius:6px;padding:8px;font-size:11px;color:#5f4000">
          <strong>📌 PLS-SEM Tip:</strong> When using latent variable scores from SmartPLS, export the factor scores as separate columns. Each latent variable score becomes one covariate in SaNaSoft-ANN.
        </div>
      </div>`,
    keyPoint:'Leong et al. (2025) use Scale-level covariates only. Dependent variable is the PLS-SEM criterion construct. Covariates are the predictor latent variable scores.',
    warning:''
  },

  // ─── Step 3: Partitions (Figure 19) ──────────────────────────────
  {
    label:'3. Partitions',
    title:'Step 3: Data Partitioning — Figure 19 from Leong et al. (2025)',
    sub:'This is one of the most critical settings. Leong et al. (2025) explicitly recommend 90% Training / 10% Testing / 0% Holdout with random assignment.',
    spssTitle:'Multilayer Perceptron — Partitions',
    spssTabsHtml:`<div class="spss-tab">Variables</div><div class="spss-tab active">Partitions</div><div class="spss-tab">Architecture</div><div class="spss-tab">Training</div><div class="spss-tab">Output</div><div class="spss-tab">Save</div><div class="spss-tab">Export</div>`,
    spssContentHtml:`
      <div style="padding:4px">
        <div class="spss-group">
          <div class="spss-group-title">Training, Testing, and Holdout Samples</div>
          <div class="spss-group-body">
            <div class="spss-radio"><input type="radio" checked> Randomly assign cases based on relative numbers of cases</div>
            <div class="spss-radio"><input type="radio"> Randomly assign cases based on percentages of cases</div>
            <div style="margin:4px 0;border-top:1px solid #ddd;padding-top:6px">
              <div class="spss-field"><span>Training:</span><input type="text" value="9" style="background:#ffffcc;border:2px solid #1565c0"></div>
              <div class="spss-field"><span>Testing:</span><input type="text" value="1"></div>
              <div class="spss-field"><span>Holdout:</span><input type="text" value="0"></div>
              <div class="spss-field" style="border-top:1px solid #ddd;margin-top:4px;padding-top:4px"><span><strong>Total:</strong></span><input type="text" value="10" style="background:#f5f5f5"></div>
            </div>
            <div class="spss-radio" style="margin-top:6px"><input type="radio"> Use variable to assign cases</div>
          </div>
        </div>
        <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;padding:6px 10px;font-size:10px;color:#0d47a1;margin-top:4px">
          ℹ️ Leong et al. (2025, Fig. 19): Training=9, Testing=1, Holdout=0, Total=10 (i.e. 90/10/0%)
        </div>
      </div>
      <div class="spss-btn-row"><button class="spss-btn primary">OK</button><button class="spss-btn">Paste</button><button class="spss-btn">Reset</button><button class="spss-btn">Cancel</button><button class="spss-btn">Help</button></div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">3</span> <div><strong>SaNaSoft-ANN Step 3: Partitioning</strong> — 10-fold cross-validation gives exactly 90/10 in every network</div></div>
      <div style="font-size:12px;line-height:1.7;color:#374151">
        <div style="margin-bottom:8px">The visual partition bar updates in real-time as you drag the sliders.</div>
        <div style="background:#fff;border:1.5px solid #dde1f0;border-radius:8px;overflow:hidden;margin-bottom:10px">
          <div style="height:30px;display:flex;border-radius:6px;overflow:hidden;margin:8px">
            <div style="width:90%;background:#1a237e;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700">Training 90%</div>
            <div style="width:10%;background:#ff8f00;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700">Test 10%</div>
          </div>
          <div style="padding:6px 10px;font-size:11px;color:#6b7280">← Drag sliders to adjust (90/10 recommended)</div>
        </div>
        <div style="background:#e8f5e9;border-radius:6px;padding:8px;font-size:11px;color:#1b5e20">
          <strong>✅ Compliance check:</strong> SaNaSoft-ANN automatically flags at Step 7 if your partition deviates from 90/10. The compliance checker shows a green tick when this guideline is met.
        </div>
      </div>`,
    keyPoint:'Leong et al. (2025, p. 730): "we recommend using a 90% training sample and 10% testing sample … allocating 90 percent … to training ensures sufficient data are available for learning." The compliance checker enforces this.',
    warning:'Do NOT use a holdout sample unless your dataset has >1,000 observations. Leong et al. (2025) found that holdout samples reduce training data unnecessarily for typical social science datasets (n=100–500).'
  },

  // ─── Step 4: Architecture (Figure 20) ────────────────────────────
  {
    label:'4. Architecture',
    title:'Step 4: Network Architecture — Figure 20 from Leong et al. (2025)',
    sub:'The Architecture tab controls the network\'s structure: how many hidden layers, how many neurons per layer, and which activation functions. Leong et al. (2025) provide specific recommendations for each setting.',
    spssTitle:'Multilayer Perceptron — Architecture',
    spssTabsHtml:`<div class="spss-tab">Variables</div><div class="spss-tab">Partitions</div><div class="spss-tab active">Architecture</div><div class="spss-tab">Training</div><div class="spss-tab">Output</div><div class="spss-tab">Save</div><div class="spss-tab">Export</div>`,
    spssContentHtml:`
      <div style="padding:4px">
        <div class="spss-group">
          <div class="spss-group-title">Hidden Layers</div>
          <div class="spss-group-body">
            <div class="spss-radio"><input type="radio"> Automatically compute the number of units in the hidden layer</div>
            <div class="spss-radio"><input type="radio" checked> <strong>Custom architecture</strong></div>
            <div style="margin-left:16px;margin-top:4px;background:#ffffcc;border:2px solid #1565c0;border-radius:4px;padding:6px">
              <div class="spss-field">Number of hidden layers: <input type="text" value="2" style="background:#fff"></div>
              <div style="margin-top:4px;font-size:10px;font-weight:700;color:#333">Units in each hidden layer:</div>
              <div class="spss-field"><span style="margin-left:8px">Hidden layer 1:</span> <input type="text" value="Automatic"></div>
              <div class="spss-field"><span style="margin-left:8px">Hidden layer 2:</span> <input type="text" value="Automatic"></div>
            </div>
          </div>
        </div>
        <div class="spss-group" style="margin-top:6px">
          <div class="spss-group-title">Activation Functions</div>
          <div class="spss-group-body">
            <div class="spss-field">Hidden layer activation: <select style="font-size:10px;border:2px solid #1565c0;background:#ffffcc;pointer-events:none"><option selected>Sigmoid</option><option>Hyperbolic tangent</option><option>ReLU</option></select></div>
            <div class="spss-field" style="margin-top:4px">Output layer activation: <select style="font-size:10px;border:2px solid #1565c0;background:#ffffcc;pointer-events:none"><option selected>Sigmoid</option><option>Identity</option><option>Softmax</option></select></div>
          </div>
        </div>
        <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;padding:6px 10px;font-size:10px;color:#0d47a1;margin-top:4px">
          ℹ️ Fig. 20: Custom, 2 hidden layers, Automatic neurons, Sigmoid (hidden + output), Standardized
        </div>
      </div>
      <div class="spss-btn-row"><button class="spss-btn primary">OK</button><button class="spss-btn">Paste</button><button class="spss-btn">Reset</button><button class="spss-btn">Cancel</button><button class="spss-btn">Help</button></div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">4</span> <div><strong>SaNaSoft-ANN Step 4: Architecture</strong> — all Figure 20 settings built-in</div></div>
      <div style="font-size:12px;line-height:1.7;color:#374151">
        <div style="background:#e8eaf6;border-radius:8px;padding:10px;margin-bottom:8px">
          <strong>Leong et al. (2025) recommended settings (pre-set in SaNaSoft):</strong>
          <table style="margin-top:6px;width:100%;font-size:11px;border-collapse:collapse">
            <tr><td style="padding:3px 6px;font-weight:600">Architecture type:</td><td style="padding:3px 6px;background:#c5cae9;border-radius:4px">Custom</td></tr>
            <tr><td style="padding:3px 6px;font-weight:600">Hidden layers:</td><td style="padding:3px 6px;background:#c5cae9;border-radius:4px">2</td></tr>
            <tr><td style="padding:3px 6px;font-weight:600">Neurons per layer:</td><td style="padding:3px 6px;background:#c5cae9;border-radius:4px">Automatic ✅</td></tr>
            <tr><td style="padding:3px 6px;font-weight:600">Hidden activation:</td><td style="padding:3px 6px;background:#c5cae9;border-radius:4px">Sigmoid ✅</td></tr>
            <tr><td style="padding:3px 6px;font-weight:600">Output activation:</td><td style="padding:3px 6px;background:#c5cae9;border-radius:4px">Sigmoid ✅</td></tr>
            <tr><td style="padding:3px 6px;font-weight:600">Output rescaling:</td><td style="padding:3px 6px;background:#c5cae9;border-radius:4px">Standardized ✅</td></tr>
          </table>
        </div>
        <div style="background:#fff3e0;border-radius:6px;padding:8px;font-size:11px;color:#5f4000">
          <strong>💡 About "Automatic" neurons:</strong> SPSS computes the number automatically using p/2 to 2p heuristics (where p = number of inputs). In SaNaSoft-ANN, keep <em>Automatically compute hidden units</em> switched on (the default). SaNaSoft-ANN's <em>Automatic</em> option searches a grid of hidden-unit counts and keeps the smallest network with near-lowest testing error.
        </div>
      </div>`,
    keyPoint:'Leong et al. (2025, p. 729): "we recommend using … two hidden layers … sigmoid activation functions for both the hidden layer and the output layer." Sigmoid forces outputs to [0,1] range, ideal when DV is a mean-centered latent score.',
    warning:'Using ReLU or Tanh activation in the hidden layers deviates from Leong et al. (2025). The compliance checker flags this as a deviation and suggests sigmoid.'
  },

  // ─── Step 5: Training (FFBP) ─────────────────────────────────────
  {
    label:'5. Training',
    title:'Step 5: Training Algorithm — FFBP (Backpropagation)',
    sub:'SPSS provides a Training tab where you select the learning algorithm and stopping rules. Leong et al. (2025) recommend the Feed-Forward Backpropagation (FFBP) algorithm — the classic and most well-understood method.',
    spssTitle:'Multilayer Perceptron — Training',
    spssTabsHtml:`<div class="spss-tab">Variables</div><div class="spss-tab">Partitions</div><div class="spss-tab">Architecture</div><div class="spss-tab active">Training</div><div class="spss-tab">Output</div><div class="spss-tab">Save</div><div class="spss-tab">Export</div>`,
    spssContentHtml:`
      <div style="padding:4px">
        <div class="spss-group">
          <div class="spss-group-title">Type of Training</div>
          <div class="spss-group-body">
            <div class="spss-radio"><input type="radio" checked> <strong>Batch</strong></div>
            <div class="spss-radio"><input type="radio"> Online</div>
            <div class="spss-radio"><input type="radio"> Mini-batch</div>
          </div>
        </div>
        <div class="spss-group" style="margin-top:6px">
          <div class="spss-group-title">Optimization Algorithm</div>
          <div class="spss-group-body">
            <div class="spss-radio"><input type="radio" checked> <span style="background:#ffffcc;border:2px solid #1565c0;padding:1px 4px;border-radius:3px"><strong>Gradient descent</strong></span> (Feed-forward backpropagation — FFBP)</div>
            <div class="spss-radio"><input type="radio"> Conjugate gradient (Scaled Conjugate Gradient — SCG)</div>
          </div>
        </div>
        <div class="spss-group" style="margin-top:6px">
          <div class="spss-group-title">Stopping Rules</div>
          <div class="spss-group-body" style="gap:3px">
            <div class="spss-check"><input type="checkbox" checked> Maximum steps without decrease in error: <input type="text" value="1" style="width:30px;margin-left:4px"></div>
            <div class="spss-check"><input type="checkbox" checked> Maximum training time (minutes): <input type="text" value="15" style="width:30px;margin-left:4px"></div>
            <div class="spss-check"><input type="checkbox" checked> Maximum epochs: <input type="text" value="500" style="width:40px;margin-left:4px"></div>
          </div>
        </div>
        <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;padding:6px 10px;font-size:10px;color:#0d47a1;margin-top:4px">
          ℹ️ Leong et al. (2025): Batch gradient descent = FFBP algorithm
        </div>
      </div>
      <div class="spss-btn-row"><button class="spss-btn primary">OK</button><button class="spss-btn">Paste</button><button class="spss-btn">Reset</button><button class="spss-btn">Cancel</button><button class="spss-btn">Help</button></div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">5</span> <div><strong>SaNaSoft-ANN Step 5: Training</strong> — FFBP is the default algorithm</div></div>
      <div style="font-size:12px;line-height:1.7;color:#374151">
        <div style="background:#e8eaf6;border-radius:8px;padding:10px;margin-bottom:8px">
          <strong>Algorithm mapping: SPSS → SaNaSoft-ANN</strong>
          <table style="margin-top:6px;width:100%;font-size:11px;border-collapse:collapse">
            <tr style="background:#c5cae9"><td style="padding:3px 6px;font-weight:700">SPSS Setting</td><td style="padding:3px 6px;font-weight:700">SaNaSoft-ANN Equivalent</td></tr>
            <tr><td style="padding:3px 6px">Batch gradient descent</td><td style="padding:3px 6px;background:#e8f5e9">FFBP (Feed-Forward Backpropagation) ✅</td></tr>
            <tr><td style="padding:3px 6px">Conjugate gradient</td><td style="padding:3px 6px">SCG option</td></tr>
            <tr><td style="padding:3px 6px">Max steps no decrease: 1</td><td style="padding:3px 6px">Stops No Decrease: 1</td></tr>
            <tr><td style="padding:3px 6px">Max epochs: 500</td><td style="padding:3px 6px">Max Epochs: 500</td></tr>
            <tr><td style="padding:3px 6px">Max time: 15 min</td><td style="padding:3px 6px">Max Training Time: 15 min</td></tr>
          </table>
        </div>
        <div style="background:#e8f5e9;border-radius:6px;padding:8px;font-size:11px;color:#1b5e20">
          <strong>✅ 10-fold Cross-Validation</strong> — SaNaSoft-ANN runs this automatically (SPSS requires you to re-run the MLP ten times by hand). Ten networks are trained on ten different 90/10 splits and the RMSE and importance values are averaged, exactly as Leong et al. (2025) prescribe.
        </div>
      </div>`,
    keyPoint:'Leong et al. (2025, p. 729): "FFBP algorithm … is the most widely used … The batch gradient descent algorithm … minimizes the error over the full training sample before updating weights."',
    warning:''
  },

  // ─── Step 6: Output Tab (Figure 21) ──────────────────────────────
  {
    label:'6. Output',
    title:'Step 6: Output Options — Figure 21 from Leong et al. (2025)',
    sub:'The Output tab in SPSS controls what results are displayed. Leong et al. (2025) require specific outputs to be enabled — especially Synaptic Weights and Independent Variable Importance.',
    spssTitle:'Multilayer Perceptron — Output',
    spssTabsHtml:`<div class="spss-tab">Variables</div><div class="spss-tab">Partitions</div><div class="spss-tab">Architecture</div><div class="spss-tab">Training</div><div class="spss-tab active">Output</div><div class="spss-tab">Save</div><div class="spss-tab">Export</div>`,
    spssContentHtml:`
      <div style="padding:4px">
        <div class="spss-group">
          <div class="spss-group-title">Viewer Output</div>
          <div class="spss-group-body" style="gap:3px">
            <div class="spss-check"><input type="checkbox" checked> Description</div>
            <div class="spss-check"><input type="checkbox" checked> <span style="background:#ffffcc;border:2px solid #1565c0;padding:1px 4px;border-radius:3px">Diagram</span> ← Network architecture visualization</div>
            <div class="spss-check"><input type="checkbox" checked> <span style="background:#ffffcc;border:2px solid #1565c0;padding:1px 4px;border-radius:3px">Synaptic weights</span> ← Required by Leong et al.</div>
            <div class="spss-check"><input type="checkbox" checked> <span style="background:#ffffcc;border:2px solid #1565c0;padding:1px 4px;border-radius:3px">Model summary</span> ← SSE, Relative Error, R²</div>
            <div class="spss-check"><input type="checkbox" checked> Classification results</div>
            <div class="spss-check"><input type="checkbox" checked> Case processing summary</div>
            <div class="spss-check"><input type="checkbox" checked> <span style="background:#ffffcc;border:2px solid #1565c0;padding:1px 4px;border-radius:3px">Independent variable importance</span> ← Required</div>
          </div>
        </div>
        <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;padding:6px 10px;font-size:10px;color:#0d47a1;margin-top:6px">
          ℹ️ Fig. 21 (p. 733): All highlighted items must be checked per Leong et al. (2025)
        </div>
      </div>
      <div class="spss-btn-row"><button class="spss-btn primary">OK</button><button class="spss-btn">Paste</button><button class="spss-btn">Reset</button><button class="spss-btn">Cancel</button><button class="spss-btn">Help</button></div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">6</span> <div><strong>SaNaSoft-ANN Step 6: Output Options</strong> — all mandatory outputs enabled by default</div></div>
      <div style="font-size:12px;line-height:1.7;color:#374151">
        <div style="background:#e8eaf6;border-radius:8px;padding:10px;margin-bottom:8px">
          <strong>SPSS Figure 21 → SaNaSoft-ANN Output Options:</strong>
          <table style="margin-top:6px;width:100%;font-size:11px;border-collapse:collapse">
            <tr style="background:#c5cae9"><td style="padding:3px 6px;font-weight:700">SPSS Output</td><td style="padding:3px 6px;font-weight:700">SaNaSoft-ANN Tab</td><td style="padding:3px 6px;font-weight:700">Required?</td></tr>
            <tr><td style="padding:3px 6px">Case processing summary</td><td style="padding:3px 6px">Case Processing tab</td><td style="padding:3px 6px;color:#2e7d32">✅ Mandatory</td></tr>
            <tr><td style="padding:3px 6px">Model summary (SSE, R²)</td><td style="padding:3px 6px">Model Summary tab</td><td style="padding:3px 6px;color:#2e7d32">✅ Mandatory</td></tr>
            <tr><td style="padding:3px 6px">Network diagram</td><td style="padding:3px 6px">Network Diagram tab</td><td style="padding:3px 6px;color:#2e7d32">✅ Mandatory</td></tr>
            <tr><td style="padding:3px 6px">Synaptic weights</td><td style="padding:3px 6px">Synaptic Weights tab</td><td style="padding:3px 6px;color:#c62828;font-weight:700">⚡ Critical</td></tr>
            <tr><td style="padding:3px 6px">Indep. variable importance</td><td style="padding:3px 6px">Variable Importance tab</td><td style="padding:3px 6px;color:#c62828;font-weight:700">⚡ Critical</td></tr>
            <tr><td style="padding:3px 6px">—</td><td style="padding:3px 6px">Training Curve tab ⭐</td><td style="padding:3px 6px;color:#5c6bc0">SaNaSoft extra</td></tr>
            <tr><td style="padding:3px 6px">—</td><td style="padding:3px 6px">CV Results tab ⭐</td><td style="padding:3px 6px;color:#5c6bc0">SaNaSoft extra</td></tr>
          </table>
        </div>
      </div>`,
    keyPoint:'Leong et al. (2025, p. 733): "synaptic weights [and] independent variable importance analysis must be enabled." The compliance checker at Step 7 verifies both are toggled ON.',
    warning:'If Synaptic Weights or Variable Importance is disabled in Step 6, the compliance checker will display a red warning at Step 7 and the report generation will be incomplete.'
  },

  // ─── Step 7: Results (Tables 9, 10, Figure 22) ───────────────────
  {
    label:'7. Results',
    title:'Step 7–8: Reading the Results — Tables 9 & 10 and Figure 22',
    sub:'After running the analysis in SPSS, results appear in the Output Viewer. SaNaSoft-ANN shows the same outputs in organized tabs under Step 8: Results.',
    spssTitle:'IBM SPSS Statistics — Output Viewer',
    spssTabsHtml:``,
    spssContentHtml:`
      <div style="padding:4px;font-size:11px">
        <div style="font-weight:700;margin-bottom:6px;color:#1565c0">SPSS Output Viewer Results</div>
        <div style="font-weight:600;margin:6px 0 3px;border-bottom:1px solid #ddd;padding-bottom:2px">Table 9: Model Summary (p. 732)</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px">
          <tr style="background:#1565c0;color:#fff"><th style="padding:3px 6px">Sample</th><th style="padding:3px 6px">SSE</th><th style="padding:3px 6px">Relative Error</th><th style="padding:3px 6px">Stopping Rule</th></tr>
          <tr><td style="padding:3px 6px">Training</td><td style="padding:3px 6px;background:#ffffcc;font-weight:700">7.772</td><td style="padding:3px 6px;background:#ffffcc;font-weight:700">.431</td><td style="padding:3px 6px;font-size:9px">1 consecutive step…</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:3px 6px">Testing</td><td style="padding:3px 6px">.711</td><td style="padding:3px 6px">.420</td><td style="padding:3px 6px"></td></tr>
        </table>
        <div style="font-weight:600;margin:6px 0 3px;border-bottom:1px solid #ddd;padding-bottom:2px">Table 10: Variable Importance (p. 732)</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px">
          <tr style="background:#1565c0;color:#fff"><th style="padding:3px 6px">Variable</th><th style="padding:3px 6px">Importance</th><th style="padding:3px 6px">Normalized (%)</th></tr>
          <tr><td style="padding:3px 6px;font-weight:700">UB</td><td style="padding:3px 6px;background:#ffffcc;font-weight:700">.266</td><td style="padding:3px 6px;background:#ffffcc;font-weight:700">100.0%</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:3px 6px">VB</td><td style="padding:3px 6px">.224</td><td style="padding:3px 6px">84.1%</td></tr>
          <tr><td style="padding:3px 6px">RB</td><td style="padding:3px 6px">.211</td><td style="padding:3px 6px">79.5%</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:3px 6px">TB</td><td style="padding:3px 6px">.201</td><td style="padding:3px 6px">75.7%</td></tr>
          <tr><td style="padding:3px 6px">IB</td><td style="padding:3px 6px">.098</td><td style="padding:3px 6px">37.0%</td></tr>
        </table>
        <div style="font-weight:600;margin:6px 0 3px;border-bottom:1px solid #ddd;padding-bottom:2px">Figure 22: Network Diagram</div>
        <svg width="100%" height="90" viewBox="0 0 260 90">
          <line x1="40" y1="15" x2="110" y2="20" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="15" x2="110" y2="40" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="15" x2="110" y2="60" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="30" x2="110" y2="20" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="30" x2="110" y2="40" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="30" x2="110" y2="60" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="45" x2="110" y2="20" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="45" x2="110" y2="40" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="45" x2="110" y2="60" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="60" x2="110" y2="20" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="60" x2="110" y2="40" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="60" x2="110" y2="60" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="75" x2="110" y2="20" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="75" x2="110" y2="40" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="40" y1="75" x2="110" y2="60" stroke="#90caf9" stroke-width="0.7"/>
          <line x1="110" y1="20" x2="170" y2="30" stroke="#a5d6a7" stroke-width="0.7"/>
          <line x1="110" y1="20" x2="170" y2="55" stroke="#a5d6a7" stroke-width="0.7"/>
          <line x1="110" y1="40" x2="170" y2="30" stroke="#a5d6a7" stroke-width="0.7"/>
          <line x1="110" y1="40" x2="170" y2="55" stroke="#a5d6a7" stroke-width="0.7"/>
          <line x1="110" y1="60" x2="170" y2="30" stroke="#a5d6a7" stroke-width="0.7"/>
          <line x1="110" y1="60" x2="170" y2="55" stroke="#a5d6a7" stroke-width="0.7"/>
          <line x1="170" y1="30" x2="225" y2="42" stroke="#ef9a9a" stroke-width="1"/>
          <line x1="170" y1="55" x2="225" y2="42" stroke="#ef9a9a" stroke-width="1"/>
          <circle cx="40" cy="15" r="7" fill="#ff8f00" stroke="#fff" stroke-width="1.5"/>
          <circle cx="40" cy="30" r="7" fill="#ff8f00" stroke="#fff" stroke-width="1.5"/>
          <circle cx="40" cy="45" r="7" fill="#ff8f00" stroke="#fff" stroke-width="1.5"/>
          <circle cx="40" cy="60" r="7" fill="#ff8f00" stroke="#fff" stroke-width="1.5"/>
          <circle cx="40" cy="75" r="7" fill="#ff8f00" stroke="#fff" stroke-width="1.5"/>
          <circle cx="110" cy="20" r="7" fill="#1565c0" stroke="#fff" stroke-width="1.5"/>
          <circle cx="110" cy="40" r="7" fill="#1565c0" stroke="#fff" stroke-width="1.5"/>
          <circle cx="110" cy="60" r="7" fill="#1565c0" stroke="#fff" stroke-width="1.5"/>
          <circle cx="170" cy="30" r="7" fill="#3949ab" stroke="#fff" stroke-width="1.5"/>
          <circle cx="170" cy="55" r="7" fill="#3949ab" stroke="#fff" stroke-width="1.5"/>
          <circle cx="225" cy="42" r="8" fill="#2e7d32" stroke="#fff" stroke-width="1.5"/>
          <text x="40" y="3" text-anchor="middle" font-size="7" fill="#555">Input</text>
          <text x="110" y="8" text-anchor="middle" font-size="7" fill="#555">H-Layer 1</text>
          <text x="170" y="18" text-anchor="middle" font-size="7" fill="#555">H-Layer 2</text>
          <text x="225" y="30" text-anchor="middle" font-size="7" fill="#555">Output</text>
          <text x="5" y="18" text-anchor="start" font-size="7" fill="#555">UB</text>
          <text x="5" y="33" text-anchor="start" font-size="7" fill="#555">VB</text>
          <text x="5" y="48" text-anchor="start" font-size="7" fill="#555">RB</text>
          <text x="5" y="63" text-anchor="start" font-size="7" fill="#555">TB</text>
          <text x="5" y="78" text-anchor="start" font-size="7" fill="#555">IB</text>
          <text x="225" y="45" text-anchor="middle" font-size="7" fill="#fff" font-weight="700">R</text>
        </svg>
      </div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">7</span><span class="sana-step-num" style="margin-left:6px">8</span> <div><strong>SaNaSoft-ANN Steps 7 & 8: Review → Run → Results</strong></div></div>
      <div style="font-size:12px;line-height:1.7;color:#374151">
        <div style="background:#e8eaf6;border-radius:8px;padding:10px;margin-bottom:8px">
          <strong>How to read SaNaSoft-ANN results (Step 8 tabs):</strong>
          <div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
            <div style="background:#fff;border:1px solid #dde1f0;border-radius:6px;padding:6px">
              <div style="font-weight:700;color:#1a237e;margin-bottom:3px">📋 Model Summary tab</div>
              Training R², Testing R², SSE, Relative Error — equivalent to SPSS Table 9
            </div>
            <div style="background:#fff;border:1px solid #dde1f0;border-radius:6px;padding:6px">
              <div style="font-weight:700;color:#1a237e;margin-bottom:3px">📊 Variable Importance tab</div>
              Bar chart + table with importance scores and normalized % — equivalent to SPSS Table 10
            </div>
            <div style="background:#fff;border:1px solid #dde1f0;border-radius:6px;padding:6px">
              <div style="font-weight:700;color:#1a237e;margin-bottom:3px">🧠 Network Diagram tab</div>
              Interactive visualization — equivalent to SPSS Figure 22
            </div>
            <div style="background:#fff;border:1px solid #dde1f0;border-radius:6px;padding:6px">
              <div style="font-weight:700;color:#1a237e;margin-bottom:3px">🔗 Synaptic Weights tab</div>
              Full weight matrix table — required by Leong et al. (2025)
            </div>
          </div>
        </div>
        <div style="background:#fff3e0;border-radius:6px;padding:8px;font-size:11px;color:#5f4000">
          <strong>📌 Sensitivity Analysis:</strong> SaNaSoft-ANN computes each predictor's relative importance in every one of the ten networks, averages them, and expresses each average as a percentage of the largest average (normalized importance) — the exact sensitivity-analysis procedure of Leong et al. (2025).
        </div>
      </div>`,
    keyPoint:'Leong et al. (2025, Table 10): The variable with the highest normalized importance (100%) is the most influential predictor. In their example, "UB" (Utilitarian Benefit) ranked first at .266 (100%), confirming nonlinear predictive dominance beyond what PLS-SEM reported.',
    warning:''
  },

  // ─── Step 8: Report ───────────────────────────────────────────────
  {
    label:'8. Report',
    title:'Step 9: Generating the Publication-Ready Report',
    sub:'SPSS does not generate an APA-formatted report — researchers must write results manually. SaNaSoft-ANN auto-generates a fully formatted report with all required elements.',
    spssTitle:'SPSS — Manual Report Writing Required',
    spssTabsHtml:``,
    spssContentHtml:`
      <div style="padding:10px;font-size:11px">
        <div style="font-weight:700;margin-bottom:8px;color:#c62828">⚠️ In SPSS, you must write the results section manually:</div>
        <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:10px;font-family:'Times New Roman',serif;font-size:11px;line-height:1.7;color:#222">
          <strong>Example Results Section (manually written by researcher):</strong>
          <hr style="margin:6px 0">
          <p>Following Leong et al. (2025), we conducted a multilayer perceptron ANN analysis using SPSS Statistics. The model employed a 90%/10% train/test partition, two hidden layers with sigmoid activation functions, and the FFBP training algorithm. The model achieved an R² of .569 on the training sample and .580 on the testing sample...</p>
          <p style="margin-top:6px">Variable importance analysis revealed that [Variable 1] was the most influential predictor (normalized importance = 100%), followed by [Variable 2] (84.1%), [Variable 3] (79.5%)...</p>
        </div>
        <div style="margin-top:8px;background:#ffebee;border:1px solid #ef9a9a;border-radius:6px;padding:8px;color:#c62828">
          <strong>Pain points of manual reporting:</strong>
          <ul style="margin-top:4px;padding-left:16px;line-height:1.8">
            <li>Must remember all recommended citations</li>
            <li>Must format tables manually in APA/Chicago/Harvard style</li>
            <li>Risk of missing required reporting elements</li>
            <li>Takes 30–60 minutes to write properly</li>
          </ul>
        </div>
      </div>`,
    sanaHtml:`
      <div class="sana-step-ref"><span class="sana-step-num">9</span> <div><strong>SaNaSoft-ANN Step 9: Report Generation</strong> — fully automated</div></div>
      <div style="font-size:12px;line-height:1.7;color:#374151">
        <div style="background:#e8eaf6;border-radius:8px;padding:10px;margin-bottom:8px">
          <strong>SaNaSoft-ANN auto-generates reports in 5 styles:</strong>
          <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px">
            <span style="background:#1a237e;color:#fff;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:600">APA 7th</span>
            <span style="background:#3949ab;color:#fff;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:600">APA 6th</span>
            <span style="background:#37474f;color:#fff;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:600">Chicago</span>
            <span style="background:#4a148c;color:#fff;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:600">Harvard</span>
            <span style="background:#1b5e20;color:#fff;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:600">Vancouver</span>
          </div>
        </div>
        <div style="background:#e8f5e9;border-radius:8px;padding:10px;margin-bottom:8px">
          <strong style="color:#2e7d32">✅ Report includes (automatically):</strong>
          <ul style="margin-top:6px;padding-left:18px;font-size:11px;line-height:1.8;color:#1b5e20">
            <li>All model settings (partition, layers, activation, algorithm)</li>
            <li>Training and testing R², SSE, Relative Error</li>
            <li>Variable importance table with normalized scores</li>
            <li>RMSE table for all ten networks (mean and SD) and R²</li>
            <li>Compliance statement ("Following Leong et al., 2025...")</li>
            <li>Complete, verified reference list in your chosen style</li>
          </ul>
        </div>
        <div style="background:#fff3e0;border-radius:6px;padding:8px;font-size:11px;color:#5f4000">
          <strong>💡 Tip:</strong> Click "Download Word (.doc)" or "Copy formatted" and paste into your manuscript — tables keep their APA formatting. The report is structured to match journal requirements.
        </div>
      </div>`,
    keyPoint:'Leong et al. (2025, p. 733): Required reporting elements include: (1) R² for training and testing, (2) variable importance scores and normalized percentages, (3) network diagram, (4) synaptic weights table, and (5) sensitivity analysis narrative.',
    warning:''
  }
];

let tutStep = 0;

function openTutorial(){
  tutStep = 0;
  renderTutorial();
  document.getElementById('tutorial-overlay').classList.add('show');
}

function closeTutorial(){
  document.getElementById('tutorial-overlay').classList.remove('show');
}

function tutNav(dir){
  tutStep = Math.max(0, Math.min(TUT_STEPS.length-1, tutStep+dir));
  renderTutorial();
}

function tutGoto(i){
  tutStep = i;
  renderTutorial();
}

function renderTutorial(){
  const s = TUT_STEPS[tutStep];
  const n = TUT_STEPS.length;

  // Nav tabs
  document.getElementById('tut-nav').innerHTML = TUT_STEPS.map((t,i)=>
    `<button class="tut-tab ${i===tutStep?'active':''}" onclick="tutGoto(${i})">${t.label}</button>`
  ).join('');

  // Counter
  document.getElementById('tut-counter').textContent = `Step ${tutStep+1} of ${n}`;

  // Prev/Next buttons
  const prev = document.getElementById('tut-prev');
  const next = document.getElementById('tut-next');
  prev.disabled = tutStep===0;
  prev.style.opacity = tutStep===0?'0.4':'1';
  if(tutStep===n-1){
    next.textContent = '✓ Close';
    next.onclick = closeTutorial;
  } else {
    next.textContent = 'Next →';
    next.onclick = ()=>tutNav(1);
  }

  // Build SPSS mockup tabs
  const tabsHtml = s.spssTabsHtml
    ? `<div class="spss-tabs">${s.spssTabsHtml}</div>`
    : '';

  // Body
  document.getElementById('tut-body').innerHTML = `
    <div class="tut-step-title">${s.title}</div>
    <div class="tut-step-sub">${s.sub}</div>

    <div class="tut-compare">
      <div class="tut-panel spss">
        <div class="tut-panel-header">🖥️ SPSS Statistics (IBM)</div>
        <div class="tut-panel-body" style="padding:8px">
          <div class="spss-mockup">
            <div class="spss-titlebar">
              <span>📊</span> ${s.spssTitle}
            </div>
            <div class="spss-menu">
              <span>File</span><span>Edit</span><span>View</span><span>Data</span>
              <span>Transform</span><span>Analyze</span><span>Graphs</span><span>Utilities</span><span>Help</span>
            </div>
            ${tabsHtml}
            <div class="spss-content">
              ${s.spssContentHtml}
            </div>
          </div>
          <div class="figure-label">Recreated from Leong et al. (2025, Journal of Computer Information Systems)</div>
        </div>
      </div>

      <div class="tut-panel sana">
        <div class="tut-panel-header">✨ SaNaSoft-ANN (This App)</div>
        <div class="tut-panel-body">
          ${s.sanaHtml}
        </div>
      </div>
    </div>

    ${s.keyPoint ? `<div class="tut-key-points"><strong>📌 Key Guideline (Leong et al., 2025):</strong> ${s.keyPoint}</div>` : ''}
    ${s.warning  ? `<div class="tut-warning"><strong>⚠️ Important:</strong> ${s.warning}</div>` : ''}

    <div style="margin-top:14px;padding:10px 14px;background:#f0f2f8;border-radius:8px;font-size:11px;color:#6b7280">
      <strong>Reference:</strong> Leong, L.-Y., Hew, T.-S., Ooi, K.-B., Tan, G. W.-H., &amp; Koohang, A. (2025). An SEM-ANN approach – Guidelines in information systems research. <em>Journal of Computer Information Systems, 65</em>(6), 706–737. https://doi.org/10.1080/08874417.2024.2329128
    </div>
  `;
}

// Close tutorial on overlay click (outside modal)
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tutorial-overlay').addEventListener('click', function(e){
    if(e.target === this) closeTutorial();
  });
});
