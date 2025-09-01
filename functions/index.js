const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.getNextEcrNumber = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const db = admin.firestore();
  const ecrRef = db.collection('ecr_forms');
  const currentYear = new Date().getFullYear();

  // Query for ECRs in the current year, order by ID descending, and get the last one.
  const query = ecrRef
    .where('id', '>=', `ECR-${currentYear}-000`)
    .where('id', '<', `ECR-${currentYear + 1}-000`)
    .orderBy('id', 'desc')
    .limit(1);

  try {
    const snapshot = await query.get();
    let nextNumber = 1;

    if (!snapshot.empty) {
      const lastEcrId = snapshot.docs[0].id;
      // E.g., "ECR-2024-005" -> parts = ["ECR", "2024", "005"]
      const parts = lastEcrId.split('-');
      if (parts.length === 3) {
          const lastNumber = parseInt(parts[2], 10);
          if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
          }
      }
    }

    // Format the number with leading zeros
    const formattedNumber = String(nextNumber).padStart(3, '0');
    const newEcrId = `ECR-${currentYear}-${formattedNumber}`;

    return { newEcrId: newEcrId };

  } catch (error) {
    console.error("Error getting next ECR number:", error);
    throw new functions.https.HttpsError('internal', 'Could not retrieve the next ECR number.');
  }
});

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
  const docId = formData.id;

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
