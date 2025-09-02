const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({origin: true});

admin.initializeApp();

exports.saveFormWithValidation = functions.https.onCall(async (data, context) => {
  // Check that the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { formType, formData } = data;
  if (!formType || !formData) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "formType" and "formData" arguments.');
  }

  // --- ECR Validation ---
  if (formType === 'ecr') {
    // The ecr_no is now generated server-side, so we don't validate its presence from the client.
    const requiredFields = [
        { key: 'denominacion_producto', label: 'Denominación del Producto' },
        { key: 'situacion_existente', label: 'Situación Existente' },
        { key: 'situacion_propuesta', label: 'Situación Propuesta' }
    ];

    for (const field of requiredFields) {
        if (!formData[field.key] || formData[field.key].trim() === '') {
            throw new functions.https.HttpsError('invalid-argument', `El campo "${field.label}" no puede estar vacío.`);
        }
    }
  }

  // --- ECO Validation ---
  else if (formType === 'eco') {
    if (!formData['ecr_no'] || formData['ecr_no'].trim() === '') {
        throw new functions.https.HttpsError('invalid-argument', 'El campo "ECR N°" no puede estar vacío.');
    }
    const hasComments = Object.values(formData.comments).some(comment => comment.trim() !== '');
    const hasChecklists = Object.values(formData.checklists).some(section =>
        section.some(item => item.si || item.na)
    );

    if (!hasComments && !hasChecklists) {
        throw new functions.https.HttpsError('invalid-argument', 'El formulario ECO está vacío. Agregue al menos un comentario o marque una opción en el checklist.');
    }
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'El "formType" debe ser "ecr" o "eco".');
  }

  // --- Firestore Write Logic ---
  const db = admin.firestore();
  const collectionName = formType === 'ecr' ? 'ecr_forms' : 'eco_forms';
  let docId = formData.id;

  // --- ECR Number Generation (if new ECR) ---
  if (formType === 'ecr' && !docId) {
    const counterRef = db.collection('counters').doc('ecr_counter');
    try {
      const newEcrNumber = await db.runTransaction(async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        const currentYear = new Date().getFullYear();
        let nextNumber = 1;

        if (counterSnap.exists) {
          const counterData = counterSnap.data();
          if (counterData.year === currentYear) {
            nextNumber = counterData.count + 1;
          }
        }
        transaction.set(counterRef, { count: nextNumber, year: currentYear }, { merge: true });
        return `ECR-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
      });

      // Assign the new number to the form data and use it as the document ID
      formData.ecr_no = newEcrNumber;
      formData.id = newEcrNumber;
      docId = newEcrNumber;

    } catch (error) {
      console.error("Error generating ECR number in transaction:", error);
      throw new functions.https.HttpsError('internal', 'Failed to generate ECR number.');
    }
  }

  if (!docId) {
    throw new functions.https.HttpsError('invalid-argument', 'The document ID is missing.');
  }

  const docRef = db.collection(collectionName).doc(docId);
  const historyRef = docRef.collection('history');

  const dataToSave = {
      ...formData,
      lastModified: new Date(),
      modifiedBy: context.auth.token.email || 'Unknown',
      serverValidated: true // Add a flag to indicate server validation was run
  };

  try {
    const batch = db.batch();
    batch.set(docRef, dataToSave, { merge: true });

    const historyDocRef = historyRef.doc();
    batch.set(historyDocRef, dataToSave);

    await batch.commit();
    return { success: true, message: `${formType.toUpperCase()} guardado con éxito.` };
  } catch (error) {
    console.error(`Error saving ${formType} form:`, error);
    throw new functions.https.HttpsError('internal', `Error al guardar el formulario ${formType.toUpperCase()}.`);
  }
});
