import 'dotenv/config';
import { query, getPool } from '../src/lib/db.js';

export async function seedBranchMaterials() {
  console.log('[MATERIALS] Updating and seeding branch-specific materials...');

  // 1. Move pure CSE / programming materials to CSE target_branch
  await query(`
    UPDATE materials 
    SET target_branch = 'CSE' 
    WHERE id IN ('mat_1', 'mat_2', 'mat_1791998927559', 'mat_1792001797094', 'mat_1793261996966')
       OR title ILIKE '%DSA%' 
       OR title ILIKE '%Java%' 
       OR title ILIKE '%Binary Search%'
       OR title ILIKE '%System Design%';
  `);

  // Ensure behavioral notes remain All branches
  await query(`
    UPDATE materials 
    SET target_branch = 'All'
    WHERE id = 'mat_3' OR title ILIKE '%Behavioral Interview STAR%';
  `);

  // 2. Insert ECE specific materials
  const eceMaterials = [
    {
      id: 'mat_ece_1',
      title: 'VLSI Design & Verilog HDL Placement Handbook',
      description: 'Comprehensive placement handbook covering CMOS logic gates, Verilog synthesis, static timing analysis (STA), setup and hold time slack, and FSM design.',
      category: 'Core Engineering',
      material_type: 'pdf',
      target_branch: 'ECE',
      uploaded_by: 'Prof. R. Venkatesh (ECE Dept)',
      notes_content: 'Key VLSI interview concepts:\n1. Static Timing Analysis (STA): Setup Time (Tsetup) vs Hold Time (Thold)\n2. Verilog HDL: Blocking (=) vs Non-blocking (<=) assignments\n3. Metastability and Synchronizer circuits\n4. CMOS Inverter VTC curve and noise margins\n5. Finite State Machine (Moore vs Mealy models)',
      file_url: 'https://example.com/ece-vlsi-handbook.pdf',
      playlist: JSON.stringify([])
    },
    {
      id: 'mat_ece_2',
      title: 'Digital Signal Processing (DSP) & Architecture Video Playlist',
      description: 'Complete video lecture module on Discrete Fourier Transform (DFT), FFT algorithms, FIR/IIR filter design, and Texas Instruments DSP programming.',
      category: 'Core Engineering',
      material_type: 'video',
      target_branch: 'ECE',
      uploaded_by: 'ECE Faculty & Placement Cell',
      notes_content: 'DSP placement preparation series for hardware/firmware roles in Qualcomm, Texas Instruments, Intel, and Analog Devices.',
      file_url: 'https://www.youtube.com/watch?v=r18Gi8BMkEI',
      playlist: JSON.stringify([
        { id: 'p1', title: 'Lecture 1: Discrete Fourier Transform & FFT Decimation in Time', type: 'video', fileUrl: 'https://www.youtube.com/watch?v=r18Gi8BMkEI' },
        { id: 'p2', title: 'Lecture 2: FIR and IIR Filter Realization and Pole-Zero Stability', type: 'video', fileUrl: 'https://www.youtube.com/watch?v=xpDnVSmNFX0' },
        { id: 'p3', title: 'Lecture 3: DSP Hardware Architecture and MAC Unit Optimization', type: 'video', fileUrl: 'https://www.youtube.com/watch?v=r18Gi8BMkEI' }
      ])
    },
    {
      id: 'mat_ece_3',
      title: 'Embedded Systems & ARM Cortex Microcontroller Guide',
      description: 'Low-level firmware engineering: I2C, SPI, UART, Timer interrupts, DMA controllers, and Embedded C bare-metal programming.',
      category: 'Core Engineering',
      material_type: 'pdf',
      target_branch: 'ECE',
      uploaded_by: 'Dr. K. Ramanathan (Embedded Systems Lab)',
      notes_content: 'Essential embedded systems checklist:\n- Peripheral communication: I2C (2-wire open drain with pullups) vs SPI (4-wire full duplex synchronous)\n- UART baud rate calculation and parity\n- Interrupt Service Routine (ISR) latency and reentrancy\n- Bit-masking and memory mapped register manipulation in Embedded C',
      file_url: 'https://example.com/embedded-systems-arm.pdf',
      playlist: JSON.stringify([])
    },
    {
      id: 'mat_ece_4',
      title: 'Analog CMOS Integrated Circuits & Op-Amp Analysis',
      description: 'Analog circuit theory, Differential amplifiers, Common Source / Common Drain amplifiers, feedback stability, and frequency compensation.',
      category: 'Core Engineering',
      material_type: 'note',
      target_branch: 'ECE',
      uploaded_by: 'Prof. R. Venkatesh (ECE Dept)',
      notes_content: 'Analog Electronics placement formula cheat sheet:\n- Small signal MOSFET parameters: gm = sqrt(2*mu*Cox*(W/L)*Id), ro = 1/(lambda*Id)\n- Common-Source gain: Av = -gm * (ro || Rd)\n- Op-Amp Gain Bandwidth Product (GBW) and Slew Rate (SR = dVout/dt = Itail/Cc)\n- Phase Margin and Gain Margin calculation for closed-loop stability',
      file_url: null,
      playlist: JSON.stringify([])
    },
    {
      id: 'mat_ece_5',
      title: 'ECE Core Technical Placement Interview Questions & Answers',
      description: 'Top 100 core hardware engineering interview questions asked in Texas Instruments, Qualcomm, NXP, and MediaTek campus drives.',
      category: 'Interview Prep',
      material_type: 'pdf',
      target_branch: 'ECE',
      uploaded_by: 'University Placement & Training Cell',
      notes_content: '100 Curated placement questions and verified answers covering Digital Design, Analog Electronics, Microprocessors, Signals & Systems, and Communication Systems.',
      file_url: 'https://example.com/ece-interview-qa.pdf',
      playlist: JSON.stringify([])
    },
    {
      id: 'mat_it_1',
      title: 'Cloud Architecture, Docker & Kubernetes Engineering Guide',
      description: 'Enterprise IT infrastructure notes covering containers, pods, ingress controllers, microservices, and CI/CD pipelines.',
      category: 'Web Development',
      material_type: 'pdf',
      target_branch: 'IT',
      uploaded_by: 'Department of Information Technology',
      notes_content: 'Key cloud and DevOps topics: Containerization, Kubernetes architecture, Docker multi-stage builds, Envoy proxy, and observability.',
      file_url: 'https://example.com/it-cloud-guide.pdf',
      playlist: JSON.stringify([])
    },
    {
      id: 'mat_eee_1',
      title: 'Electric Drives, Power Electronics & EV Motor Control',
      description: 'Comprehensive study material for electrical engineering placements in EV, automotive, and power grid companies.',
      category: 'Core Engineering',
      material_type: 'pdf',
      target_branch: 'EEE',
      uploaded_by: 'Prof. A. Nambiar (EEE Dept)',
      notes_content: 'Covers Inverters, Buck-Boost converters, BLDC and Induction motor speed control algorithms, and battery management systems (BMS).',
      file_url: 'https://example.com/eee-power-handbook.pdf',
      playlist: JSON.stringify([])
    },
    {
      id: 'mat_mech_1',
      title: 'Thermodynamics, Heat Transfer & CAD/CAM Placement Notes',
      description: 'Core mechanical engineering placement module: Otto/Diesel cycles, heat exchangers, fluid mechanics, and GD&T principles.',
      category: 'Core Engineering',
      material_type: 'pdf',
      target_branch: 'MECH',
      uploaded_by: 'Mechanical Engineering Placement Cell',
      notes_content: 'Placement formulas and interview concepts: First and Second Laws of Thermodynamics, Carnot efficiency, conduction/convection/radiation equations, and finite element basics.',
      file_url: 'https://example.com/mech-thermo-notes.pdf',
      playlist: JSON.stringify([])
    }
  ];

  for (const m of eceMaterials) {
    await query(`
      INSERT INTO materials (id, title, description, category, material_type, target_branch, uploaded_by, notes_content, file_url, reference_link, playlist, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        material_type = EXCLUDED.material_type,
        target_branch = EXCLUDED.target_branch,
        uploaded_by = EXCLUDED.uploaded_by,
        notes_content = EXCLUDED.notes_content,
        file_url = EXCLUDED.file_url,
        reference_link = EXCLUDED.reference_link,
        playlist = EXCLUDED.playlist,
        updated_at = NOW();
    `, [m.id, m.title, m.description, m.category, m.material_type, m.target_branch, m.uploaded_by, m.notes_content, m.file_url, m.playlist]);
  }

  console.log('[MATERIALS] Branch-specific materials updated and inserted successfully.');
}

if (process.argv[1]?.endsWith('seed-materials-branches.mjs')) {
  seedBranchMaterials()
    .then(() => getPool().end())
    .catch(err => {
      console.error('Error seeding branch materials:', err);
      process.exit(1);
    });
}
