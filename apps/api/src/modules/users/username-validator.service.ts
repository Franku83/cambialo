import { Injectable, BadRequestException } from '@nestjs/common'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

const BLACKLIST = [
  // Suplantación
  'cambialo', 'cambialoadmin', 'cambialoofi', 'cambialo_', 'admin', 'soporte',
  'support', 'moderador', 'moderator', 'oficial',
  // Marcas (evitar confusión)
  'apple', 'samsung', 'iphonestore', 'samsungve',
  // Slurs en español
  'marico', 'maricon', 'puta', 'puto', 'coño', 'verga', 'mierda',
  'pendejo', 'imbecil', 'idiota', 'cabron', 'hijoputa',
  // Slurs en inglés
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'kike', 'spic',
  // Fraude
  'escrow', 'garantia', 'verificador',
]

@Injectable()
export class UsernameValidatorService {
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/0/g, 'o')
      .replace(/1/g, 'l')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/8/g, 'b')
      .replace(/@/g, 'a')
      .replace(/\$/g, 's')
      .replace(/[^a-z0-9]/g, '')
  }

  isAllowed(username: string): boolean {
    if (!USERNAME_REGEX.test(username)) return false
    const normalized = this.normalize(username)
    return !BLACKLIST.some(word => normalized.includes(this.normalize(word)))
  }

  validate(username: string): void {
    if (!USERNAME_REGEX.test(username)) {
      throw new BadRequestException('El username debe tener entre 3 y 20 caracteres alfanuméricos o guión bajo')
    }
    if (!this.isAllowed(username)) {
      throw new BadRequestException('Nombre de usuario no disponible')
    }
  }
}
