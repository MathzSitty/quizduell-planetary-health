import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  try {
    // Finde zuerst den Benutzer mit dem problematischen Namen
    // oder mit email: ... falls man die email kennen sollte
    const userToDelete = await prisma.user.findFirst({
      where: {
        
        email: 'peter@beispiel.de'
      }
    });

    if (!userToDelete) {
      console.log('Benutzer nicht gefunden.');
      return;
    }

    console.log('Gefundener Benutzer:', userToDelete);
    
    // Benutzer löschen
    const deletedUser = await prisma.user.delete({
      where: {
        id: userToDelete.id
      }
    });
    
    console.log('Benutzer erfolgreich gelöscht:', deletedUser);
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();