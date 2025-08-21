import { jsPDF } from "jspdf"
var font = 'undefined';
var callAddFont = function () {
this.addFileToVFS('helvetica-normal.ttf', font);
this.addFont('helvetica-normal.ttf', 'helvetica', 'normal');
};
jsPDF.API.events.push(['addFonts', callAddFont])
