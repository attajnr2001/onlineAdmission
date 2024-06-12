// generateAdmissionLetter.js
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../helpers/firebase";

const handleGenerateAdmissionLetter = async (
  schoolID,
  student,
  program,
  house,
  reOpeningDate
) => {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const formattedDate = `${day}th ${month} ${year}`;

  const proxyUrl = "http://localhost:3001/proxy-image?url=";
  const imageUrl = `${proxyUrl}${encodeURIComponent(student.image)}`;

  const schoolData = await getDoc(doc(db, `school/${schoolID}`));
  const school = schoolData.data();
  const schoolImageBase64 = school.image;

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    const base64String = await new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });

    const qrCodeData = "Your ICT";
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);

    const imageBase64 = base64String.split(",")[1];
    const doc = new jsPDF();
    doc.addImage(schoolImageBase64, "JPEG", 10, 10, 10, 10);

    let currentY = 14;
    doc.setFontSize(10);
    doc.setFont("", "bold");
    doc.text(`${school.name}`, 23, currentY);
    doc.setFont("", "normal");
    currentY += 5;

    doc.text(`Post Office Box ${school.box} ${school.address}`, 23, currentY);
    currentY += 2;
    doc.setDrawColor(0);
    doc.line(10, currentY, 200, currentY);
    currentY += 10;

    doc.setFontSize(18);
    doc.setFont("", "bold");
    doc.text(`${school.name.toUpperCase()} SCHOOL`, 60, currentY);
    currentY += 5;
    doc.setDrawColor(0);

    currentY += 1;

    doc.setFontSize(10);
    doc.text(`(GHANA EDUCATION SERVICE)`, 65, currentY);
    currentY += 5;

    doc.text(`THE HEADMASTER`, 10, currentY);
    currentY += 5;
    doc.text(`OUR REF NUMBER:  ${school.box}`, 10, currentY);
    currentY += 5;
    doc.text(`YOUR REF NUMBER: ...............`, 10, currentY);
    currentY += 5;
    doc.text(`PHONE: ${school.phone}`, 10, currentY);
    currentY += 5;
    doc.text(`EMAIL: ${school.email}`, 10, currentY);
    currentY += 20;

    doc.text(`POST OFFICE BOX: ${school.box}`, 155, 44);
    doc.text(`Date: ${formattedDate}`, 155, 48);
    doc.addImage(schoolImageBase64, "JPEG", 87, 47, 35, 35);

    doc.line(10, currentY, 200, currentY);

    currentY += 10;
    doc.setFont("", "normal");
    doc.setFontSize(11);
    doc.text(`Dear Student,`, 10, currentY);
    currentY += 12;

    doc.setFont("", "bold");
    doc.setFontSize(12);
    doc.text(
      `OFFER OF ADMISSION INTO SENIOR HIGH SCHOOL- 2023/2024 ACADEMIC YEAR`,
      13,
      currentY
    );
    currentY += 1;
    doc.line(13, currentY, 180, currentY);

    currentY += 10;
    doc.setFont("", "bold");
    doc.addImage(imageBase64, "JPEG", 150, currentY, 30, 30);
    doc.text(`ENROLLMENT CODE: ${student.enrollmentCode}`, 10, currentY);
    currentY += 6;
    doc.text(
      `STUDENT NAME: ${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`,
      10,
      currentY
    );
    currentY += 6;
    doc.text(
      `RESIDENTIAL STATUS: ${student.status.toUpperCase()}`,
      10,
      currentY
    );
    currentY += 6;
    doc.text(`PROGRAMME: ${program.name.toUpperCase()}`, 10, currentY);
    currentY += 6;
    doc.text(
      `ADMISSION NUMBER: ${program.shortname}/${student.admissionNo}`,
      10,
      currentY
    );
    currentY += 6;
    doc.text(`HOUSE: ${house.name.toUpperCase()}`, 10, currentY);
    currentY += 12;

    currentY += 6;
    doc.setFont("", "normal");
    doc.text(
      `I am pleased to inform you that you have been offered a place at ${school.name.toUpperCase()} to
pursue a 3 year Pre-Tertiary programme leading to the West Africa Senior School Certificate
Examination`,
      10,
      currentY
    );
    currentY += 20;

    doc.text(
      `1. The reporting date for all first year students is on Monday, ${reOpeningDate} AM
      
2.  You will be required to adhere religiously to all school rules and regulations as a student
      
3. All students of the school are considered to be on probation throughout their stay in the school and
could be withdrawn/dismissed at anytime for gross misconduct.

4. On the reporting day, you are to submit a printed copy of this Admission Letter to the Senior
Housemaster/Housemistress for registration and other admission formalities.

 5. All students are expected to have active Health Insurance cards and this would be inspected by
the Housemaster/Housemistress.

6. Please accept our congratulations.

Yours faithfully,

--Digitally Signed and Secured in QR Code--

..........................................................................
${school.headMasterName.toUpperCase()}
(HEADMASTER)
`,
      10,
      currentY
    );
    currentY += 10;

    doc.addImage(qrCodeBase64, "JPEG", 150, currentY + 50, 30, 30);

    doc.save("admission_letter.pdf");
  } catch (error) {
    console.error("Error fetching image:", error);
  }
};

export default handleGenerateAdmissionLetter;
