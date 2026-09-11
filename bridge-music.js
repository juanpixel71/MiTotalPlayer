// Si usas el plugin de Capacitor FileSystem en Capacitor:
import { Filesystem, Directory } from '@capacitor/filesystem';

async function leerCarpetaMiMusica() {
  try {
    // Lectura directa del directorio público en Android
    const result = await Filesystem.readdir({
      path: 'MiMusica',
      directory: Directory.ExternalStorage
    });
    
    console.log('Archivos en MiMusica:', result.files);
  } catch (e) {
    console.error('Error al acceder a /MiMusica:', e);
  }
}
