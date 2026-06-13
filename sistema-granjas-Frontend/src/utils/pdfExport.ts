import jsPDF from 'jspdf';

// ── Constantes de diseño ──────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR = {
    green:       [22, 163, 74]   as [number, number, number],
    emerald:     [4, 120, 87]    as [number, number, number],
    greenLight:  [220, 252, 231] as [number, number, number],
    white:       [255, 255, 255] as [number, number, number],
    gray800:     [31, 41, 55]    as [number, number, number],
    gray600:     [75, 85, 99]    as [number, number, number],
    gray400:     [156, 163, 175] as [number, number, number],
    gray100:     [243, 244, 246] as [number, number, number],
    gray50:      [249, 250, 251] as [number, number, number],
    amber:       [217, 119, 6]   as [number, number, number],
    amberLight:  [254, 243, 199] as [number, number, number],
    blue:        [37, 99, 235]   as [number, number, number],
    blueLight:   [219, 234, 254] as [number, number, number],
    red:         [220, 38, 38]   as [number, number, number],
    redLight:    [254, 226, 226] as [number, number, number],
    purple:      [124, 58, 237]  as [number, number, number],
    purpleLight: [237, 233, 254] as [number, number, number],
};

// ── Helpers internos ──────────────────────────────────────────────────────────

function rgb(doc: jsPDF, color: [number, number, number]) {
    doc.setTextColor(color[0], color[1], color[2]);
}

function fillRect(doc: jsPDF, color: [number, number, number], x: number, y: number, w: number, h: number) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, w, h, 'F');
}

function drawRect(doc: jsPDF, color: [number, number, number], x: number, y: number, w: number, h: number, lineW = 0.3) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(lineW);
    doc.rect(x, y, w, h, 'S');
}

function checkPageBreak(doc: jsPDF, y: number, needed = 12): number {
    if (y + needed > PAGE_H - 20) {
        doc.addPage();
        return drawPageFooter(doc, y);
    }
    return y;
}

function drawPageFooter(doc: jsPDF, _y: number): number {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        rgb(doc, COLOR.gray400);
        const now = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Generado: ${now}`, MARGIN, PAGE_H - 8);
        doc.text(`Página ${i} de ${n}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
        doc.setDrawColor(COLOR.gray100[0], COLOR.gray100[1], COLOR.gray100[2]);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    }
    return MARGIN + 6;
}

/** Dibuja el header principal verde de la página */
function drawMainHeader(doc: jsPDF, tipo: string, titulo: string, subtitulo?: string): number {
    const headerH = subtitulo ? 38 : 32;

    // Gradiente simulado con dos rectángulos
    fillRect(doc, COLOR.green, 0, 0, PAGE_W * 0.65, headerH);
    fillRect(doc, COLOR.emerald, PAGE_W * 0.65, 0, PAGE_W * 0.35, headerH);

    // Texto del header
    doc.setFontSize(8);
    rgb(doc, [200, 240, 210]);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA GRANJAS', MARGIN, 8);
    doc.setFont('helvetica', 'normal');
    doc.text('Universidad de Caldas', MARGIN, 13);

    doc.setFontSize(9);
    rgb(doc, [200, 240, 210]);
    doc.text(tipo.toUpperCase(), PAGE_W - MARGIN, 8, { align: 'right' });

    doc.setFontSize(14);
    rgb(doc, COLOR.white);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(titulo, CONTENT_W - 10);
    doc.text(titleLines, MARGIN, 22);

    let y = headerH;

    if (subtitulo) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        rgb(doc, [200, 240, 210]);
        doc.text(subtitulo, MARGIN, headerH - 4);
    }

    return y + 6;
}

/** Dibuja un badge de estado coloreado */
function drawBadge(doc: jsPDF, label: string, x: number, y: number, bgColor: [number, number, number], textColor: [number, number, number]): number {
    doc.setFontSize(8);
    const textW = doc.getTextWidth(label);
    const padX = 3;
    const padY = 1.5;
    const bW = textW + padX * 2;
    const bH = 5.5;
    fillRect(doc, bgColor, x, y - padY - 1, bW, bH);
    rgb(doc, textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + padX, y + 1.5);
    return x + bW + 3;
}

/** Dibuja el encabezado de una sección */
function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
    y = checkPageBreak(doc, y, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    rgb(doc, COLOR.green);
    doc.text(title, MARGIN, y);
    doc.setDrawColor(COLOR.green[0], COLOR.green[1], COLOR.green[2]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
    return y + 7;
}

/** Dibuja una fila de datos etiqueta + valor */
function drawDataRow(doc: jsPDF, y: number, label: string, value: string, oddRow = false): number {
    y = checkPageBreak(doc, y, 8);
    if (oddRow) fillRect(doc, COLOR.gray50, MARGIN, y - 4, CONTENT_W, 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    rgb(doc, COLOR.gray600);
    doc.text(label + ':', MARGIN + 2, y);
    doc.setFont('helvetica', 'normal');
    rgb(doc, COLOR.gray800);
    const lines = doc.splitTextToSize(value || '—', CONTENT_W - 52);
    doc.text(lines, MARGIN + 52, y);
    return y + lines.length * 5.5 + 1.5;
}

/** Dibuja un bloque de texto largo (descripción, notas, etc.) */
function drawTextBlock(doc: jsPDF, y: number, text: string, maxW = CONTENT_W): number {
    y = checkPageBreak(doc, y, 10);
    fillRect(doc, COLOR.gray50, MARGIN, y - 3, maxW, 5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    rgb(doc, COLOR.gray800);
    const lines = doc.splitTextToSize(text, maxW - 6);
    const blockH = lines.length * 5 + 6;
    fillRect(doc, COLOR.gray50, MARGIN, y - 3, maxW, blockH);
    drawRect(doc, COLOR.gray100, MARGIN, y - 3, maxW, blockH, 0.2);
    doc.text(lines, MARGIN + 3, y + 1);
    return y + blockH + 2;
}

/** Dibuja una tabla simple de dos columnas */
function drawTable(doc: jsPDF, y: number, rows: { label: string; value: string }[]): number {
    const col1W = 50;
    const col2W = CONTENT_W - col1W;

    // Header de tabla
    fillRect(doc, COLOR.green, MARGIN, y, CONTENT_W, 7);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    rgb(doc, COLOR.white);
    doc.text('Campo', MARGIN + 2, y + 5);
    doc.text('Valor', MARGIN + col1W + 2, y + 5);
    y += 7;

    rows.forEach((row, i) => {
        y = checkPageBreak(doc, y, 7);
        if (i % 2 === 0) fillRect(doc, COLOR.gray50, MARGIN, y, CONTENT_W, 7);
        const valLines = doc.splitTextToSize(row.value || '—', col2W - 4);
        const rowH = Math.max(7, valLines.length * 5 + 2);
        if (i % 2 === 0) fillRect(doc, COLOR.gray50, MARGIN, y, CONTENT_W, rowH);
        drawRect(doc, COLOR.gray100, MARGIN, y, CONTENT_W, rowH, 0.2);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        rgb(doc, COLOR.gray600);
        doc.text(row.label, MARGIN + 2, y + 5);

        doc.setFont('helvetica', 'normal');
        rgb(doc, COLOR.gray800);
        doc.text(valLines, MARGIN + col1W + 2, y + 5);
        y += rowH;
    });
    return y + 3;
}

// ── Exportar diagnóstico ──────────────────────────────────────────────────────

export function exportarDiagnosticoPDF(data: any): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const tipo = data.tipo_diagnostico?.replace(/_/g, ' ') || 'Sin tipo';
    const titulo = `Diagnóstico #${data.id} — ${tipo}`;
    let y = drawMainHeader(doc, 'Diagnóstico', titulo);

    // ── Badges de estado ──
    const estadoLabel = data.estado_revision === 'revisado' ? 'REVISADO' : 'PENDIENTE';
    const estadoBg = data.estado_revision === 'revisado' ? COLOR.greenLight : COLOR.amberLight;
    const estadoText = data.estado_revision === 'revisado' ? COLOR.green : COLOR.amber;
    drawBadge(doc, estadoLabel, MARGIN, y + 2, estadoBg, estadoText);

    if (data.condiciones_dia) {
        drawBadge(doc, data.condiciones_dia, MARGIN + 40, y + 2, COLOR.blueLight, COLOR.blue);
    }
    y += 10;

    // ── Información general ──
    y = drawSectionHeader(doc, y, '1. Información general');
    const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

    const infoRows: { label: string; value: string }[] = [
        { label: 'ID', value: String(data.id) },
        { label: 'Tipo de diagnóstico', value: tipo },
        { label: 'Estado de revisión', value: data.estado_revision === 'revisado' ? 'Revisado' : 'Pendiente' },
        { label: 'Fecha de creación', value: fmtDate(data.fecha_creacion) },
        { label: 'Condiciones del día', value: data.condiciones_dia || '—' },
    ];
    infoRows.forEach((r, i) => { y = drawDataRow(doc, y, r.label, r.value, i % 2 === 0); });

    // ── Autor y ubicación ──
    y += 3;
    y = drawSectionHeader(doc, y, '2. Autor y ubicación');
    const locationRows = [
        { label: 'Autor', value: data.usuario_nombre || data.usuario_email || '—' },
        { label: 'Programa', value: data.programa_nombre || '—' },
        { label: 'Lote', value: data.lote_nombre || (data.lote_id ? `Lote #${data.lote_id}` : '—') },
        { label: 'Granja', value: data.granja_nombre || '—' },
    ];
    locationRows.forEach((r, i) => { y = drawDataRow(doc, y, r.label, r.value, i % 2 === 0); });

    // ── Métricas ──
    y += 3;
    y = drawSectionHeader(doc, y, '3. Métricas de monitoreo');
    const form = data.formulario;
    const plantasCount = form?.plantas?.length || 0;
    const fotosCount = form?.fotos_subidas ? Object.values(form.fotos_subidas as Record<string, string[]>).flat().length : 0;
    const metricRows = [
        { label: 'Plantas evaluadas', value: String(plantasCount) },
        { label: 'Fotos subidas', value: String(fotosCount) },
        { label: 'Total plantas lote', value: form?.total_plantas_lote ? String(form.total_plantas_lote) : '—' },
        { label: '% Muestreo', value: form?.porcentaje_muestreo ? `${form.porcentaje_muestreo}%` : '—' },
    ];
    metricRows.forEach((r, i) => { y = drawDataRow(doc, y, r.label, r.value, i % 2 === 0); });

    // ── Caracterización general ──
    const caract = form?.caracterizacion;
    if (caract && Object.keys(caract).length > 0) {
        y += 3;
        y = drawSectionHeader(doc, y, '4. Caracterización general');
        const caractRows = Object.entries(caract).map(([k, v]) => ({
            label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: Array.isArray(v) ? (v as any[]).join(', ') : String(v ?? '—'),
        }));
        y = drawTable(doc, y, caractRows);
    }

    // ── Recomendaciones vinculadas ──
    if (data.recomendaciones?.length > 0) {
        y += 3;
        y = drawSectionHeader(doc, y, '5. Recomendaciones vinculadas');
        data.recomendaciones.forEach((r: any, i: number) => {
            y = checkPageBreak(doc, y, 12);
            fillRect(doc, i % 2 === 0 ? COLOR.greenLight : COLOR.gray50, MARGIN, y - 3, CONTENT_W, 10);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            rgb(doc, COLOR.green);
            doc.text(`${i + 1}. ${r.titulo}`, MARGIN + 2, y + 1);
            if (r.descripcion) {
                doc.setFont('helvetica', 'normal');
                rgb(doc, COLOR.gray600);
                doc.setFontSize(8);
                const dLines = doc.splitTextToSize(r.descripcion, CONTENT_W - 6);
                doc.text(dLines.slice(0, 2), MARGIN + 4, y + 6);
                y += dLines.slice(0, 2).length * 4.5 + 2;
            }
            y += 8;
        });
    }

    drawPageFooter(doc, y);
    doc.save(`diagnostico-${data.id}.pdf`);
}

// ── Exportar recomendación ────────────────────────────────────────────────────

const ESTADO_LABELS: Record<string, string> = {
    pendiente:    'PENDIENTE',
    aprobada:     'APROBADA',
    rechazada:    'RECHAZADA',
    en_ejecucion: 'EN EJECUCIÓN',
    completada:   'COMPLETADA',
};

const ESTADO_COLORS: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
    pendiente:    { bg: COLOR.amberLight,  text: COLOR.amber },
    aprobada:     { bg: COLOR.greenLight,  text: COLOR.green },
    rechazada:    { bg: COLOR.redLight,    text: COLOR.red },
    en_ejecucion: { bg: COLOR.blueLight,   text: COLOR.blue },
    completada:   { bg: COLOR.purpleLight, text: COLOR.purple },
};

export function exportarRecomendacionPDF(data: any, loteInfo?: any, granjaInfo?: any, diagnosticoInfo?: any, evidencias?: any[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const titulo = `Recomendación #${data.id} — ${data.titulo || 'Sin título'}`;
    let y = drawMainHeader(doc, 'Recomendación', titulo, data.tipo ? `Tipo: ${data.tipo}` : undefined);

    // ── Badges ──
    const estadoConf = ESTADO_COLORS[data.estado] || { bg: COLOR.gray100, text: COLOR.gray600 };
    const estadoLabel = ESTADO_LABELS[data.estado] || data.estado?.toUpperCase() || 'SIN ESTADO';
    drawBadge(doc, estadoLabel, MARGIN, y + 2, estadoConf.bg, estadoConf.text);

    const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    if (data.fecha_creacion) {
        const dateLabel = fmtDate(data.fecha_creacion);
        drawBadge(doc, dateLabel, MARGIN + 50, y + 2, COLOR.gray100, COLOR.gray600);
    }
    y += 11;

    // ── Información general ──
    y = drawSectionHeader(doc, y, '1. Información general');
    const infoRows = [
        { label: 'ID', value: String(data.id) },
        { label: 'Título', value: data.titulo || '—' },
        { label: 'Tipo', value: data.tipo || '—' },
        { label: 'Estado', value: estadoLabel },
        { label: 'Docente', value: data.docente_nombre || 'Sin asignar' },
        { label: 'Fecha de creación', value: fmtDate(data.fecha_creacion) },
        ...(data.fecha_aprobacion ? [{ label: 'Fecha de aprobación', value: fmtDate(data.fecha_aprobacion) }] : []),
        ...(data.labores_count !== undefined ? [{ label: 'Labores asociadas', value: String(data.labores_count) }] : []),
    ];
    infoRows.forEach((r, i) => { y = drawDataRow(doc, y, r.label, r.value, i % 2 === 0); });

    // ── Descripción ──
    if (data.descripcion) {
        y += 3;
        y = drawSectionHeader(doc, y, '2. Descripción');
        y = drawTextBlock(doc, y, data.descripcion);
    }

    // ── Contexto (Lote / Granja) ──
    y += 3;
    y = drawSectionHeader(doc, y, '3. Contexto geográfico');
    const ctxRows: { label: string; value: string }[] = [];
    if (loteInfo) {
        ctxRows.push({ label: 'Lote', value: loteInfo.nombre || '—' });
        if (loteInfo.cultivo_nombre) ctxRows.push({ label: 'Cultivo', value: loteInfo.cultivo_nombre });
        if (loteInfo.tipo_gestion) ctxRows.push({ label: 'Tipo gestión', value: loteInfo.tipo_gestion });
    } else {
        ctxRows.push({ label: 'Lote', value: data.lote_nombre || (data.lote_id ? `#${data.lote_id}` : '—') });
    }
    if (granjaInfo) {
        ctxRows.push({ label: 'Granja', value: granjaInfo.nombre || '—' });
        if (granjaInfo.ubicacion) ctxRows.push({ label: 'Ubicación', value: granjaInfo.ubicacion });
    } else {
        ctxRows.push({ label: 'Granja', value: data.granja_nombre || '—' });
    }
    ctxRows.forEach((r, i) => { y = drawDataRow(doc, y, r.label, r.value, i % 2 === 0); });

    // ── Diagnóstico asociado ──
    if (diagnosticoInfo || data.diagnostico_id) {
        y += 3;
        y = drawSectionHeader(doc, y, '4. Diagnóstico asociado');
        if (diagnosticoInfo) {
            const diagRows = [
                { label: 'ID', value: String(diagnosticoInfo.id) },
                { label: 'Tipo', value: diagnosticoInfo.tipo?.replace(/_/g, ' ') || '—' },
                { label: 'Estado', value: diagnosticoInfo.estado || '—' },
                { label: 'Fecha', value: fmtDate(diagnosticoInfo.fecha_creacion) },
            ];
            diagRows.forEach((r, i) => { y = drawDataRow(doc, y, r.label, r.value, i % 2 === 0); });
        } else {
            y = drawDataRow(doc, y, 'ID diagnóstico', `#${data.diagnostico_id}`, false);
        }
    }

    // ── Evidencias ──
    if (evidencias && evidencias.length > 0) {
        y += 3;
        y = drawSectionHeader(doc, y, '5. Evidencias adjuntas');
        evidencias.forEach((ev: any, i: number) => {
            y = checkPageBreak(doc, y, 14);
            fillRect(doc, i % 2 === 0 ? COLOR.gray50 : COLOR.white, MARGIN, y - 2, CONTENT_W, 11);
            drawRect(doc, COLOR.gray100, MARGIN, y - 2, CONTENT_W, 11, 0.2);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            rgb(doc, COLOR.gray800);
            doc.text(`${i + 1}. ${(ev.tipo || 'Archivo').toUpperCase()}`, MARGIN + 2, y + 2);

            doc.setFont('helvetica', 'normal');
            rgb(doc, COLOR.gray600);
            doc.setFontSize(8);
            if (ev.descripcion) {
                const descLines = doc.splitTextToSize(ev.descripcion, CONTENT_W - 10);
                doc.text(descLines[0], MARGIN + 2, y + 6.5);
            }
            rgb(doc, COLOR.gray400);
            doc.text(`Subido: ${ev.usuario_nombre || 'Usuario'} · ${new Date(ev.fecha_creacion).toLocaleDateString('es-CO')}`, MARGIN + 2, y + 10.5);
            y += 14;
        });
    }

    drawPageFooter(doc, y);
    doc.save(`recomendacion-${data.id}.pdf`);
}
