const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');

const serviceAccount = require('../google-services.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

async function sendUserNotifications(title, message, userIds) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        fcmToken: true,
      },
    })

    if (users.length === 0) {
      console.log("No users found with the specified IDs.")
      return
    }

    const tokens = users.map(user => user.fcmToken).filter(token => token)

    if (tokens.length === 0) {
      console.log("No FCM tokens found for the specified users");
      return
    }

    const messagePayload = {
      notification: {
        title: title,
        body: message,
      },
      tokens: tokens,
    }

    await admin.messaging().sendMulticast(messagePayload)
  } 
  catch (error) {
    console.error(error)
  }
}

module.exports = {
  sendUserNotifications
}