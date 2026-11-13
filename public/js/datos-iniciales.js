/* Módulo: datos iniciales. Se carga en el orden indicado en index.html. */
    const initEquipos = [
      {
        id: '1', activo: 'EQ-2026-001', serie: 'SN-998231', nombre: 'Monitor de Signos Vitales', marca: 'Mindray', modelo: 'ePM 12',
        ubicacion: 'SEDE CENTRAL', sububicacion: 'UCI - Cama 04', servicio: 'Enfermería', estado: 'Operativo', clasificacion: 'Clase II',
        sap: 'SAP-4001', sicop: 'SICOP-9921', fechaIngreso: '2015-03-15', loem: 10,
        condicionGarantia: 'Bajo Contrato', tipoGarantia: '', inicioGarantia: '2026-01-01', finGarantia: '2026-12-31',
        numProcedimiento: 'CNT-2026-08A', contactoProveedor: 'Soporte MedCorp (2222-9999)',
        frecuenciaMaint: 'Semestral', nextMaint: '2026-09-15', observaciones: 'Equipo en excelente estado operacional.', img: ''
      },
      {
        id: '2', activo: 'EQ-2026-042', serie: 'SN-441029', nombre: 'Ventilador Mecánico', marca: 'Dräger', modelo: 'Savina 300',
        ubicacion: 'EBAIS SAN JERONIMO', sububicacion: 'Preconsulta', servicio: 'Médicos', estado: 'En Mantenimiento', clasificacion: 'Clase III',
        sap: 'SAP-8821', sicop: 'SICOP-1002', fechaIngreso: '2020-06-10', loem: 8,
        condicionGarantia: 'Bajo Garantía', tipoGarantia: 'DEI', inicioGarantia: '2025-06-10', finGarantia: '2027-06-10',
        numProcedimiento: 'CNT-2026-08A', contactoProveedor: 'Dra. Solano BioServ',
        frecuenciaMaint: 'Trimestral', nextMaint: '2026-08-30', observaciones: 'Requiere cambio de sensor de oxígeno.', img: ''
      },
      {
        id: '3', activo: 'EQ-2026-003', serie: 'SN-445566', nombre: 'Unidad Dental Completa', marca: 'A-dec', modelo: '300',
        ubicacion: 'EBAIS CIRRI', sububicacion: 'Odontología 1', servicio: 'Odontología', estado: 'Operativo', clasificacion: 'Clase I',
        sap: 'SAP-400131', sicop: 'SICOP-2026-03', fechaIngreso: '2016-01-10', loem: 10,
        condicionGarantia: 'Ninguno', tipoGarantia: '', inicioGarantia: '', finGarantia: '',
        numProcedimiento: '', contactoProveedor: 'A-dec Soporte',
        frecuenciaMaint: 'Semestral', nextMaint: '2026-11-20', observaciones: 'Mantenimiento preventivo al día.', img: ''
      },
      {
        id: '4', activo: 'EQ-2026-004', serie: 'SN-778899', nombre: 'Desfibrilador Bifásico', marca: 'Zoll', modelo: 'M Series',
        ubicacion: 'SEDE CENTRAL', sububicacion: 'Paro Cardíaco', servicio: 'Médicos', estado: 'Operativo', clasificacion: 'Clase III',
        sap: 'SAP-400132', sicop: 'SICOP-2026-04', fechaIngreso: '2022-04-12', loem: 8,
        condicionGarantia: 'Bajo Garantía', tipoGarantia: 'ASN', inicioGarantia: '2022-04-12', finGarantia: '2027-04-12',
        numProcedimiento: '', contactoProveedor: 'Zoll Medical CR',
        frecuenciaMaint: 'Semestral', nextMaint: '2026-10-15', observaciones: 'Batería en buen estado.', img: ''
      }
    ];

    const initBodega = [
      { id: '1', parte: 'PN-SPO2-01', nombre: 'Sensor SpO2 Adulto Reutilizable', categoria: 'Sensores y Cables', marca: 'Mindray', sap: 'SAP-800101', sicop: 'SICOP-REP-01', estante: 'Estante A-01', proveedor: 'Electromedicina Global S.A.', compatibilidad: 'Monitor de Signos Vitales (ePM 12), BeneView T8', stock: 12, min: 5, moneda: '$', costo: '120.00', observaciones: 'Reutilizable, limpiar con alcohol isopropílico.', img: '' },
      { id: '2', parte: 'BAT-ZOLL-09', nombre: 'Batería Litio Desfibrilador', categoria: 'Filtros y Baterías', marca: 'Zoll', sap: 'SAP-800102', sicop: 'SICOP-REP-02', estante: 'Estante B-03', proveedor: 'BioServicios Hospitalarios', compatibilidad: 'Desfibrilador Bifásico (M Series), M Series', stock: 1, min: 3, moneda: '$', costo: '350.00', observaciones: 'Reemplazar cada 2 años.', img: '' },
      { id: '3', parte: 'FLT-DRG-33', nombre: 'Filtro Antibacteriano Ventilador', categoria: 'Filtros y Baterías', marca: 'Dräger', sap: 'SAP-800103', sicop: 'SICOP-REP-03', estante: 'Estante C-02', proveedor: 'BioServicios Hospitalarios', compatibilidad: 'Ventilador Mecánico (Savina 300)', stock: 2, min: 10, moneda: '₡', costo: '15000.00', observaciones: 'Insumo de un solo uso por paciente.', img: '' }
    ];

    const initOT = [
      { id: '1', numero: 'OT-1001', equipoId: '2', equipoNombre: 'EQ-2026-042 Ventilador Mecánico', tipo: 'Correctivo', tecnico: 'Ing. Ramírez', falla: 'Falla en celda de O2', estado: 'Abierta' }
    ];

    const initMovs = [
      { id: '1', fecha: '2026-08-18', repuesto: 'Sensor SpO2 Adulto Reutilizable', cant: 2, equipo: 'EQ-2026-001 Monitor', tecnico: 'Ing. Ramírez' }
    ];

    const initSalidasEquipos = [
      {
        id: "1",
        equipoId: "2",
        activo: "EQ-2026-042",
        serie: "SN-441029",
        equipoNombre: "Ventilador Mecánico",
        retira: "Juan Pérez (Chofer)",
        autoriza: "Ing. Ramírez",
        proveedor: "BioServicios Hospitalarios",
        fechaSalida: "2026-08-18T08:00",
        motivo: "Reparación de Celda de O2",
        fechaPrevista: "2026-08-25",
        estado: "Enviado / Fuera de la institución",
        fechaDevolucion: "",
        recibe: "",
        estadoDevolucion: "",
        comentarios: [
          { fecha: "2026-08-18 08:00", usuario: "Ing. Ramírez", texto: "Equipo retirado para cambio de tarjeta lógica y celda de O2." }
        ]
      }
    ];

    const initProvs = [
      { id: '1', nombre: 'Electromedicina Global S.A.', contacto: 'Lic. Juan Pérez', tel: '+506 2222-1111', email: 'ventas@emglobal.com' },
      { id: '2', nombre: 'BioServicios Hospitalarios', contacto: 'Dra. María Solano', tel: '+506 2280-9900', email: 'soporte@bioserv.com' }
    ];

    const initAverias = [
      {
        id: '1',
        numero: 'REP-101',
        equipoId: '2',
        activo: 'EQ-2026-042',
        serie: 'SN-441029',
        equipoNombre: 'Ventilador Mecánico',
        ubicacion: 'EBAIS SAN JERONIMO',
        servicio: 'Preconsulta',
        fechaHora: '2026-08-18T07:30',
        reporta: 'Dra. Méndez',
        descripcion: 'El equipo arroja alarma de celda de oxígeno y falla en autocalibración.',
        prioridad: 'Urgente',
        fueraServicio: 'SI',
        estado: 'Pendiente de Atención',
        fechaResolucion: '',
        tipoAtencion: '',
        tecnicoAtendio: '',
        proveedorAtendio: '',
        repuestoUtilizado: '',
        accionesRealizadas: '',
        comentarios: [
          { fecha: "2026-08-18 07:30", usuario: "Dra. Méndez", texto: "Equipo retirado de uso clínico por alarma crítica." },
          { fecha: "2026-08-18 09:15", usuario: "Ing. Ramírez", texto: "Revisión técnica inicial: se requiere reemplazo de celda de O2 o envío a laboratorio." }
        ]
      }
    ];

    const initProcedimientos = [
      {
        id: '1',
        numero: 'LA-2026-001',
        descripcion: 'Licitación Abreviada para Mantenimiento Preventivo y Correctivo de Equipos Médicos',
        contratos: [
          {
            id: 'c1',
            numero: 'CNT-2026-08A',
            nombre: 'Mantenimiento para Monitores de Signos Vitales',
            certificacion: 'CP-2026-1042',
            proveedor: 'Electromedicina Global S.A.',
            monto: '12500000.00',
            moneda: '₡',
            inicio: '2026-01-01',
            fin: '2026-12-31',
            observaciones: 'Cobertura anual para Sede Central y EBAIS adscritos.'
          }
        ]
      }
    ];

    let equipos = JSON.parse(localStorage.getItem('EM_v51_equipos')) || initEquipos;
    let bodega = JSON.parse(localStorage.getItem('EM_v51_bodega')) || initBodega;
    let ordenes = JSON.parse(localStorage.getItem('EM_v51_ot')) || initOT;
    let movimientos = JSON.parse(localStorage.getItem('EM_v51_movs')) || initMovs;
    let salidasEquipos = JSON.parse(localStorage.getItem('EM_v51_salidas_equipos')) || initSalidasEquipos;
    let proveedores = JSON.parse(localStorage.getItem('EM_v51_provs')) || initProvs;
    let averias = JSON.parse(localStorage.getItem('EM_v51_averias')) || initAverias;
    let procedimientos = JSON.parse(localStorage.getItem('EM_v51_procedimientos')) || initProcedimientos;
    let cronogramasPreventivos = JSON.parse(localStorage.getItem('EM_v51_cronogramas_preventivos') || '[]');
    let preventiveContracts = JSON.parse(localStorage.getItem('EM_v51_preventive_contracts') || '[]');

    const DEFAULT_ADMIN = { id: 'admin-default', nombre: 'Administrador', usuario: 'admin', password: 'admin123', rol: 'admin', activo: true };
    let usuarios = JSON.parse(localStorage.getItem('EM_v51_usuarios') || 'null') || [DEFAULT_ADMIN];
    if (!usuarios.some(u => u.usuario === 'admin')) usuarios.unshift({...DEFAULT_ADMIN});
    localStorage.setItem('EM_v51_usuarios', JSON.stringify(usuarios));
    let currentUser = null;

    let selectedLocation = "TODOS";
    const DEFAULT_UBICACIONES = ["SEDE CENTRAL", "ANTIGUA SEDE", "EBAIS SAN JERONIMO", "EBAIS CIRRI", "EBAIS SAN JUAN", "EBAIS SAN JUANILLO", "EBAIS SAN ROQUE", "EBAIS SAN ANTONIO", "EBAIS CANDELARIA", "EBAIS CONCEPCION", "EBAIS ROSARIO", "EBAIS PALMITOS", "EBAIS SAN MIGUEL", "EBAIS 1", "EBAIS 2", "EBAIS 3", "EBAIS 4", "TALLER EQUIPO MEDICO"];
    let ubicaciones = [...new Set([...DEFAULT_UBICACIONES, ...JSON.parse(localStorage.getItem('EM_v51_ubicaciones') || '[]'), ...equipos.map(e => e.ubicacion).filter(Boolean)])];
    let currentExpedienteSalidaId = null;
    let currentExpedienteAveriaId = null;
    let tempEqImageData = '';
    let tempRepImageData = '';
    let currentSelectedChips = [];
    let consumoChartInstance = null;

    function saveData() {
      localStorage.setItem('EM_v51_equipos', JSON.stringify(equipos));
      localStorage.setItem('EM_v51_bodega', JSON.stringify(bodega));
      localStorage.setItem('EM_v51_ot', JSON.stringify(ordenes));
      localStorage.setItem('EM_v51_movs', JSON.stringify(movimientos));
      localStorage.setItem('EM_v51_salidas_equipos', JSON.stringify(salidasEquipos));
      localStorage.setItem('EM_v51_provs', JSON.stringify(proveedores));
      localStorage.setItem('EM_v51_averias', JSON.stringify(averias));
      localStorage.setItem('EM_v51_procedimientos', JSON.stringify(procedimientos));
      localStorage.setItem('EM_v51_cronogramas_preventivos', JSON.stringify(cronogramasPreventivos));
      localStorage.setItem('EM_v51_preventive_contracts', JSON.stringify(preventiveContracts));
      localStorage.setItem('EM_v51_ubicaciones', JSON.stringify(ubicaciones));
      try {
        renderAll();
      } catch (error) {
        console.error('La información se guardó, pero una sección visual no pudo actualizarse:', error);
      }
    }

    function resetData() {
      if (confirm('¿Restaurar todos los módulos a sus datos de demostración de fábrica?')) {
        equipos = [...initEquipos];
        bodega = [...initBodega];
        ordenes = [...initOT];
        movimientos = [...initMovs];
        salidasEquipos = [...initSalidasEquipos];
        proveedores = [...initProvs];
        averias = [...initAverias];
        procedimientos = [...initProcedimientos];
        cronogramasPreventivos = [];
        preventiveContracts = [];
        saveData();
      }
    }

