// Простой клиент для ИРБИС64

import * as net from "net";

module Irbis {

    export const UTF_ENCODING = 'utf8';
    export const ANSI_ENCODING = 'win1251';

    // Статус записи

    export const LOGICALLY_DELETED  = 1;  // Запись логически удалена
    export const PHYSICALLY_DELETED = 2;  // Запись физически удалена
    export const ABSENT             = 4;  // Запись отсутствует
    export const NON_ACTUALIZED     = 8;  // Запись не актуализирована
    export const LAST_VERSION       = 32; // Последняя версия записи
    export const LOCKED_RECORD      = 64; // Запись заблокирована на ввод

    // Распространённые форматы

    export const ALL_FORMAT       = "&uf('+0')"; // Полные данные по полям
    export const BRIEF_FORMAT     = '@brief';    // Краткое библиографическое описание
    export const IBIS_FORMAT      = '@ibiskw_h'; // Формат IBIS (старый)
    export const INFO_FORMAT      = '@info_w';   // Информационный формат
    export const OPTIMIZED_FORMAT = '@';         // Оптимизированный формат

    // Распространённые поиски

    export const KEYWORD_PREFIX    = 'K=';  // Ключевые слова
    export const AUTHOR_PREFIX     = 'A=';  // Индивидуальный автор, редактор, составитель
    export const COLLECTIVE_PREFIX = 'M=';  // Коллектив или мероприятие
    export const TITLE_PREFIX      = 'T=';  // Заглавие
    export const INVENTORY_PREFIX  = 'IN='; // Инвентарный номер, штрих-код или радиометка
    export const INDEX_PREFIX      = 'I=';  // Шифр документа в базе

    // Логические операторы для поиска

    export const LOGIC_OR                = 0; // Только ИЛИ
    export const LOGIC_OR_AND            = 1; // ИЛИ и И
    export const LOGIC_OR_AND_NOT        = 2; // ИЛИ, И, НЕТ (по умолчанию)
    export const LOGIC_OR_AND_NOT_FIELD  = 3; // ИЛИ, И, НЕТ, И (в поле)
    export const LOGIC_OR_AND_NOT_PHRASE = 4; // ИЛИ, И, НЕТ, И (в поле), И (фраза)

    // Коды АРМ

    export const ADMINISTRATOR = 'A'; // Адмнистратор
    export const CATALOGER     = 'C'; // Каталогизатор
    export const ACQUSITIONS   = 'M'; // Комплектатор
    export const READER        = 'R'; // Читатель
    export const CIRCULATION   = 'B'; // Книговыдача
    export const BOOKLAND      = 'B'; // Книговыдача
    export const PROVISITON    = 'K'; // Книгообеспеченность

    /**
     * Разделитель строк в ИРБИС.
     */
    export const IRBIS_DELIMITER = "\x1F\x1E";

    /**
     * Короткая версия разделителя строк ИРБИС.
     */
    export const SHORT_DELIMITER = "\x1E";

    /**
     * Пустая ли данная строка?
     *
     * @param text Строка для изучения.
     */
    function isNullOrEmpty(text: string) : boolean {
        return (text == null) || text == '';
    }

    function sameString(left: string, right: string) : boolean {
        return left.toUpperCase() == right.toUpperCase();
    }

    const _cp1251_from_unicode = [
        0x0000, 0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000A, 0x000B, 0x000C, 0x000D, 0x000E, 0x000F,
        0x0010, 0x0011, 0x0012, 0x0013, 0x0014, 0x0015, 0x0016, 0x0017, 0x0018, 0x0019, 0x001A, 0x001B, 0x001C, 0x001D, 0x001E, 0x001F,
        0x0020, 0x0021, 0x0022, 0x0023, 0x0024, 0x0025, 0x0026, 0x0027, 0x0028, 0x0029, 0x002A, 0x002B, 0x002C, 0x002D, 0x002E, 0x002F,
        0x0030, 0x0031, 0x0032, 0x0033, 0x0034, 0x0035, 0x0036, 0x0037, 0x0038, 0x0039, 0x003A, 0x003B, 0x003C, 0x003D, 0x003E, 0x003F,
        0x0040, 0x0041, 0x0042, 0x0043, 0x0044, 0x0045, 0x0046, 0x0047, 0x0048, 0x0049, 0x004A, 0x004B, 0x004C, 0x004D, 0x004E, 0x004F,
        0x0050, 0x0051, 0x0052, 0x0053, 0x0054, 0x0055, 0x0056, 0x0057, 0x0058, 0x0059, 0x005A, 0x005B, 0x005C, 0x005D, 0x005E, 0x005F,
        0x0060, 0x0061, 0x0062, 0x0063, 0x0064, 0x0065, 0x0066, 0x0067, 0x0068, 0x0069, 0x006A, 0x006B, 0x006C, 0x006D, 0x006E, 0x006F,
        0x0070, 0x0071, 0x0072, 0x0073, 0x0074, 0x0075, 0x0076, 0x0077, 0x0078, 0x0079, 0x007A, 0x007B, 0x007C, 0x007D, 0x007E, 0x007F,
        0x0098, 0x00A0, 0x00A4, 0x00A6, 0x00A7, 0x00A9, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x00B0, 0x00B1, 0x00B5, 0x00B6, 0x00B7, 0x00BB,
        0x0401, 0x0402, 0x0403, 0x0404, 0x0405, 0x0406, 0x0407, 0x0408, 0x0409, 0x040A, 0x040B, 0x040C, 0x040E, 0x040F, 0x0410, 0x0411,
        0x0412, 0x0413, 0x0414, 0x0415, 0x0416, 0x0417, 0x0418, 0x0419, 0x041A, 0x041B, 0x041C, 0x041D, 0x041E, 0x041F, 0x0420, 0x0421,
        0x0422, 0x0423, 0x0424, 0x0425, 0x0426, 0x0427, 0x0428, 0x0429, 0x042A, 0x042B, 0x042C, 0x042D, 0x042E, 0x042F, 0x0430, 0x0431,
        0x0432, 0x0433, 0x0434, 0x0435, 0x0436, 0x0437, 0x0438, 0x0439, 0x043A, 0x043B, 0x043C, 0x043D, 0x043E, 0x043F, 0x0440, 0x0441,
        0x0442, 0x0443, 0x0444, 0x0445, 0x0446, 0x0447, 0x0448, 0x0449, 0x044A, 0x044B, 0x044C, 0x044D, 0x044E, 0x044F, 0x0451, 0x0452,
        0x0453, 0x0454, 0x0455, 0x0456, 0x0457, 0x0458, 0x0459, 0x045A, 0x045B, 0x045C, 0x045E, 0x045F, 0x0490, 0x0491, 0x2013, 0x2014,
        0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039, 0x203A, 0x20AC, 0x2116, 0x2122
    ]; // _cp1251_from_unicode

    const _cp1251_xlat = [
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F,
        0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F,
        0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, 0x3E, 0x3F,
        0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E, 0x4F,
        0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F,
        0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C, 0x6D, 0x6E, 0x6F,
        0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x7B, 0x7C, 0x7D, 0x7E, 0x7F,
        0x98, 0xA0, 0xA4, 0xA6, 0xA7, 0xA9, 0xAB, 0xAC, 0xAD, 0xAE, 0xB0, 0xB1, 0xB5, 0xB6, 0xB7, 0xBB,
        0xA8, 0x80, 0x81, 0xAA, 0xBD, 0xB2, 0xAF, 0xA3, 0x8A, 0x8C, 0x8E, 0x8D, 0xA1, 0x8F, 0xC0, 0xC1,
        0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xCB, 0xCC, 0xCD, 0xCE, 0xCF, 0xD0, 0xD1,
        0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xDB, 0xDC, 0xDD, 0xDE, 0xDF, 0xE0, 0xE1,
        0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC, 0xED, 0xEE, 0xEF, 0xF0, 0xF1,
        0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF, 0xB8, 0x90,
        0x83, 0xBA, 0xBE, 0xB3, 0xBF, 0xBC, 0x9A, 0x9C, 0x9E, 0x9D, 0xA2, 0x9F, 0xA5, 0xB4, 0x96, 0x97,
        0x91, 0x92, 0x82, 0x93, 0x94, 0x84, 0x86, 0x87, 0x95, 0x85, 0x89, 0x8B, 0x9B, 0x88, 0xB9, 0x99
    ]; // _cp1251_xlat

    const _cp1251_to_unicode = [
        0x0000, 0x0001, 0x0002, 0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000A, 0x000B, 0x000C, 0x000D, 0x000E, 0x000F,
        0x0010, 0x0011, 0x0012, 0x0013, 0x0014, 0x0015, 0x0016, 0x0017, 0x0018, 0x0019, 0x001A, 0x001B, 0x001C, 0x001D, 0x001E, 0x001F,
        0x0020, 0x0021, 0x0022, 0x0023, 0x0024, 0x0025, 0x0026, 0x0027, 0x0028, 0x0029, 0x002A, 0x002B, 0x002C, 0x002D, 0x002E, 0x002F,
        0x0030, 0x0031, 0x0032, 0x0033, 0x0034, 0x0035, 0x0036, 0x0037, 0x0038, 0x0039, 0x003A, 0x003B, 0x003C, 0x003D, 0x003E, 0x003F,
        0x0040, 0x0041, 0x0042, 0x0043, 0x0044, 0x0045, 0x0046, 0x0047, 0x0048, 0x0049, 0x004A, 0x004B, 0x004C, 0x004D, 0x004E, 0x004F,
        0x0050, 0x0051, 0x0052, 0x0053, 0x0054, 0x0055, 0x0056, 0x0057, 0x0058, 0x0059, 0x005A, 0x005B, 0x005C, 0x005D, 0x005E, 0x005F,
        0x0060, 0x0061, 0x0062, 0x0063, 0x0064, 0x0065, 0x0066, 0x0067, 0x0068, 0x0069, 0x006A, 0x006B, 0x006C, 0x006D, 0x006E, 0x006F,
        0x0070, 0x0071, 0x0072, 0x0073, 0x0074, 0x0075, 0x0076, 0x0077, 0x0078, 0x0079, 0x007A, 0x007B, 0x007C, 0x007D, 0x007E, 0x007F,
        0x0402, 0x0403, 0x201A, 0x0453, 0x201E, 0x2026, 0x2020, 0x2021, 0x20AC, 0x2030, 0x0409, 0x2039, 0x040A, 0x040C, 0x040B, 0x040F,
        0x0452, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x0098, 0x2122, 0x0459, 0x203A, 0x045A, 0x045C, 0x045B, 0x045F,
        0x00A0, 0x040E, 0x045E, 0x0408, 0x00A4, 0x0490, 0x00A6, 0x00A7, 0x0401, 0x00A9, 0x0404, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x0407,
        0x00B0, 0x00B1, 0x0406, 0x0456, 0x0491, 0x00B5, 0x00B6, 0x00B7, 0x0451, 0x2116, 0x0454, 0x00BB, 0x0458, 0x0405, 0x0455, 0x0457,
        0x0410, 0x0411, 0x0412, 0x0413, 0x0414, 0x0415, 0x0416, 0x0417, 0x0418, 0x0419, 0x041A, 0x041B, 0x041C, 0x041D, 0x041E, 0x041F,
        0x0420, 0x0421, 0x0422, 0x0423, 0x0424, 0x0425, 0x0426, 0x0427, 0x0428, 0x0429, 0x042A, 0x042B, 0x042C, 0x042D, 0x042E, 0x042F,
        0x0430, 0x0431, 0x0432, 0x0433, 0x0434, 0x0435, 0x0436, 0x0437, 0x0438, 0x0439, 0x043A, 0x043B, 0x043C, 0x043D, 0x043E, 0x043F,
        0x0440, 0x0441, 0x0442, 0x0443, 0x0444, 0x0445, 0x0446, 0x0447, 0x0448, 0x0449, 0x044A, 0x044B, 0x044C, 0x044D, 0x044E, 0x044F
    ]; // _cp1251_to_unicode

    /**
     * Преобразование CP1251 в строку.
     *
     * @param buf Буфер.
     */
    export function cp1251_to_unicode(buf: Buffer) : string {
        var result = '';
        var len = buf.length;
        var i;

        for (i = 0; i < len; i++) {
            var c1 = buf[i];
            var c2 = _cp1251_to_unicode[c1];
            result += String.fromCharCode(c2);
        }

        return result;
    } // function cp1251_to_unicode

    /**
     * Преобразование строки в CP1251.
     *
     * @param text Текст.
     */
    export function cp1251_from_unicode(text: string) : Buffer {
        var result = Buffer.alloc(text.length);
        var len = text.length;
        var i;

        for (i = 0; i < len; i++) {
            var c1 = text.charCodeAt(i);
            var index = _cp1251_from_unicode.indexOf(c1);
            var c2 = (index >= 0)
                ? _cp1251_xlat[index]
                : '?'.charCodeAt(0);
            result[i] = c2;
        }

        return result;
    } // function cp1251_from_unicode

    /**
     * Преобразование строки в UTF-8.
     *
     * @param text Текст.
     */
    export function utf8_from_unicode(text: string) : Buffer {
        return Buffer.from(text, 'utf8');
    } // function utf8_from_unicode

    /**
     * Преобразование UTF-8 в строку.
     *
     * @param buf Буфер.
     */
    export function utf8_to_unicode(buf: Buffer) : string {
        return buf.toString('utf8');
    } // function utf8_to_unicode

    /**
     * Удаление комментариев из строки.
     *
     * @param text Текст для удаления комментариев.
     */
    function removeComments(text: string) {
        if (isNullOrEmpty(text)) {
            return text;
        }

        if (text.indexOf('/*') < 0) {
            return text;
        }

        let result = '';
        let state = '';
        let index = 0;
        let length = text.length;

        while (index < length) {
            let c = text[index];

            switch (state) {
                case "'":
                case '"':
                case '|':
                    if (c == state) {
                        state = '';
                    }

                    result += c;
                    break;

                default:
                    if (c == '/') {
                        if (index + 1 < length && text[index + 1] == '*') {
                            while (index < length) {
                                c = text[index];
                                if (c == "\r" || c == "\n") {
                                    result += c;
                                    break;
                                }

                                index++;
                            }
                        }
                        else {
                            result += c;
                        }
                    }
                    else if (c == "'" || c == '"' || c == '|') {
                        state = c;
                        result += c;
                    }
                    else {
                        result += c;
                    }
                    break;
            }

            index++;
        }

        return result;
    } // function removeComments

    /**
     * Подготовка динамического формата
     * для передачи на сервер.
     *
     * В формате должны отсутствовать комментарии
     * и служебные символы (например, перевод
     * строки или табуляция).
     *
     * @param text Текст для обработки.
     */
    export function prepareFormat (text: string) : string {
        text = removeComments(text);
        let length = text.length;
        if (length == 0) {
            return text;
        }

        let flag = false;
        for (let i: number = 0; i < length; i++) {
            if (text[i] < ' ') {
                flag = true;
                break;
            }
        }

        if (!flag) {
            return text;
        }

        let result = '';
        for (let i: number = 0; i < length; i++) {
            let c = text[i];
            if (c >= ' ') {
                result += c;
            }
        }

        return result;
    } // function prepareFormat

    /**
     * @return array "Хорошие" коды для readRecord.
     */
    function readRecordCodes(): number [] {
        return [-201, -600, -602, -603];
    } // function readRecordCodes

    /**
     * @return array "Хорошие" коды для readTerms.
     */
    function readTermCodes() : number[] {
        return [-202, -203, -204];
    } // function readTermCodes

    /**
     * Замена переводов строки с ИРБИСных на обычные.
     *
     * @param text Текст для замены.
     * @return Исправленный текст.
     */
    export function irbisToDos(text: string) : string {
        return text.replace(IRBIS_DELIMITER, "\n");
    } // function irbisToDos

    /**
     * Разбивка текста на строки по ИРБИСным разделителям.
     *
     * @param text Текст для разбиения.
     * @return Массив строк.
     */
    export function irbisToLines(text: string) : string[] {
        return text.split(IRBIS_DELIMITER);
    } // function irbisToLines

    /**
     * Получение описания по коду ошибки, возвращенному сервером.
     *
     * @param code Код ошибки.
     * @return Словесное описание ошибки.
     */
    function describeError(code: number) : string {
        if (code >= 0) {
            return 'Нет ошибки';
        }

        let errors = {
            100: 'Заданный MFN вне пределов БД',
            101: 'Ошибочный размер полки',
            102: 'Ошибочный номер полки',
            140: 'MFN вне пределов БД',
            141: 'Ошибка чтения',
            200: 'Указанное поле отсутствует',
            201: 'Предыдущая версия записи отсутствует',
            202: 'Заданный термин не найден (термин не существует)',
            203: 'Последний термин в списке',
            204: 'Первый термин в списке',
            300: 'База данных монопольно заблокирована',
            301: 'База данных монопольно заблокирована',
            400: 'Ошибка при открытии файлов MST или XRF (ошибка файла данных)',
            401: 'Ошибка при открытии файлов IFP (ошибка файла индекса)',
            402: 'Ошибка при записи',
            403: 'Ошибка при актуализации',
            600: 'Запись логически удалена',
            601: 'Запись физически удалена',
            602: 'Запись заблокирована на ввод',
            603: 'Запись логически удалена',
            605: 'Запись физически удалена',
            607: 'Ошибка autoin.gbl',
            608: 'Ошибка версии записи',
            700: 'Ошибка создания резервной копии',
            701: 'Ошибка восстановления из резервной копии',
            702: 'Ошибка сортировки',
            703: 'Ошибочный термин',
            704: 'Ошибка создания словаря',
            705: 'Ошибка загрузки словаря',
            800: 'Ошибка в параметрах глобальной корректировки',
            801: 'ERR_GBL_REP',
            802: 'ERR_GBL_MET',
            1111: 'Ошибка исполнения сервера (SERVER_EXECUTE_ERROR)',
            2222: 'Ошибка в протоколе (WRONG_PROTOCOL)',
            3333: 'Незарегистрированный клиент (ошибка входа на сервер) (клиент не в списке)',
            3334: 'Клиент не выполнил вход на сервер (клиент не используется)',
            3335: 'Неправильный уникальный идентификатор клиента',
            3336: 'Нет доступа к командам АРМ',
            3337: 'Клиент уже зарегистрирован',
            3338: 'Недопустимый клиент',
            4444: 'Неверный пароль',
            5555: 'Файл не существует',
            6666: 'Сервер перегружен. Достигнуто максимальное число потоков обработки',
            7777: 'Не удалось запустить/прервать поток администратора (ошибка процесса)',
            8888: 'Общая ошибка'
        };

        let result = errors[-code];
        if (!result) {
            result = 'Неизвестная ошибка';
        }

        return result;

    } // function describeError

    /**
     * Подполе с кодом и значением.
     */
    export class SubField {

        constructor(public code: string, public value: string) {
            // Nothing to do here yet
        }

        public validate(throwOnError: boolean): boolean {
            // TODO implement

            return true;
        }
    } // class SubField

    /**
     * Поле записи с меткой, значением и подполями.
     */
    export class RecordField {

        /**
         * Подполя.
         */
        public subfields: SubField[];

        constructor(public tag: number, public value: string) {
            this.subfields = [];
        }

        /**
         * Добавление подполя с указанными кодом и значением.
         *
         * @param code Код подполя.
         * @param value Значение подполя.
         */
        public add(code: string, value: string) : RecordField {
            let subfield = new SubField(code, value);
            this.subfields.push(subfield);

            return this;
        }

        public validate(throwOnError: boolean): boolean {
            // TODO implement

            return true;
        }
    } // class RecordField

    /**
     * Запись с полями.
     */
    export class MarcRecord {

        /**
         * Имя базы данных. Для вновь созданных записей пустая строка.
         */
        public database: string = '';

        /**
         * MFN записи. Для вновь созданных записей 0.
         */
        public mfn: number = 0;

        /**
         * Статус записи.
         */
        public status: number = 0;

        /**
         * Версия записи.
         */
        public version: number = 0;

        /**
         * Массив полей.
         */
        public fields: RecordField[];

        /**
         * Добавление в конец массива поля с указанными меткой и значением.
         *
         * @param tag Метка поля.
         * @param value Значение поля до первого разделителя.
         * @return Созданное поле.
         */
        public add(tag: number, value: string = '') : RecordField {
            let field = new RecordField(tag, value);
            this.fields.push(field);

            return field;
        }

        public decode(lines: string[]) : void {
            // TOD implement
        }

        public encode() : string {
            // TODO implement
            return '';
        }

        /**
         * @return Запись удалена
         * (неважно - логически или физически)?
         */
        public isDeleted() : boolean {
            return (this.status & 3) != 0;
        }

        public fm(tag: number, code? : string) : string {
            return '';
        }

        public validate(throwOnError: boolean = true) : boolean {
            // TODO implement
            return true;
        }
    } // class MarcRecord

    /**
     * Запись в "сыром" ("неразобранном") виде.
     */
    export class RawRecord {
        /**
         * Имя базы данных. Для вновь созданных записей пустая строка.
         */
        public database: string = '';

        /**
         * MFN записи. Для вновь созданных записей 0.
         */
        public mfn: number = 0;

        /**
         * Статус записи.
         */
        public status: number = 0;

        /**
         * Версия записи.
         */
        public version: number = 0;

        /**
         * Массив полей в виде строк.
         */
        public fields: string[];

        public decode(lines: string[]) : void {
            // TOD implement
        }

        public encode() : string {
            // TODO implement
            return '';
        }
    } // class RawRecord

    /**
     * Строка найденной записи в ответе сервера.
     */
    export class FoundLine {
        /**
         * @var Материализована?
         */
        public materialized: boolean = false;

        /**
         * @var Порядковый номер.
         */
        public serialNumber: number = 0;

        /**
         * @var MFN.
         */
        public mfn: number = 0;

        /**
         * @var Иконка.
         */
        public icon: object = null;

        /**
         * @var Выбрана (помечена)?
         */
        public selected: boolean = false;

        /**
         * @var Библиографическое описание.
         */
        public description: string = '';

        /**
         * @var Ключ для сортировки.
         */
        public sort: string = '';

        /**
         * Преобразование в массив библиографических описаний.
         *
         * @param found Найденные записи.
         * @return Массив описаний.
         */
        public static toDescription(found: FoundLine[]) : string[] {
            let result = [];
            for (let item of found) {
                result.push(item.mfn);
            }

            return result;
        }


        /**
         * Преобразование в массив MFN.
         *
         * @param found Найденные записи.
         * @return Массив MFN.
         */
        public static toMfn(found: FoundLine[]) : number[] {
            let result = [];
            for (let item of found) {
                result.push(item.mfn);
            }

            return result;
        }

    } // class FoundLine

    /**
     * Пара строк в меню.
     */
    export class MenuEntry {
        public code: string = '';
        public comment: string = '';
    } // class MenuEntry

    /**
     * Файл меню. Состоит из пар строк (см. MenuEntry).
     */
    export class MenuFile {
        public entries: MenuEntry[] = [];

        public parse(lines: string[]) : void {
            // TODO implement
        }
    } // class MenuFile

    /**
     * Строка INI-файла. Состоит из ключа
     * и (опционального) значения.
     */
    export class IniLine {
        /**
         * @var Ключ.
         */
        public key: string = '';

        /**
         * @var Значение.
         */
        public value: string = '';
    } // class IniLine

    /**
     * Секция INI-файла. Состоит из строк
     * (см. IniLine).
     */
    export class IniSection {
        /**
         * @var Имя секции.
         */
        public name: string = '';

        /**
         * @var Строки 'ключ=значение'.
         */
        public lines: IniLine[] = [];
    } // class IniSection

    /**
     * INI-файл. Состоит из секций (см. IniSection).
     */
    export class IniFile {
        /**
         * @var Секции INI-файла.
         */
        public sections: IniSection[] = [];
    } // class IniFile

    /**
     * Узел дерева TRE-файла.
     */
    export class TreeNode {
        /**
         * @var Дочерние узлы.
         */
        public children: TreeNode[] = [];

        /**
         * @var Значение, хранящееся в узле.
         */
        public value: string = '';

        /**
         * @var Уровень вложенности узла.
         */
        public level: number = 0;
    } // class TreeNode

    /**
     * Дерево, хранящееся в TRE-файле.
     */
    export class TreeFile {
        /**
         * @var Корни дерева.
         */
        public roots: TreeNode[] = [];

    } // class TreeFile

    /**
     * Информация о базе данных ИРБИС.
     */
    export class DatabaseInfo {
        /**
         * @var Имя базы данных.
         */
        public name: string = '';

        /**
         * @var Описание базы данных.
         */
        public description: string = '';

        /**
         * @var Максимальный MFN.
         */
        public maxMfn: number = 0;

        /**
         * @var Логически удалённые записи.
         */
        public logicallyDeletedRecords: number[] = [];

        /**
         * @var Физически удалённые записи.
         */
        public physicallyDeletedRecords: number[] = [];

        /**
         * @var Неактуализированные записи.
         */
        public nonActualizedRecords: number[] = [];

        /**
         * @var Заблокированные записи.
         */
        public lockedRecords: number[] = [];

        /**
         * @var Признак блокировки базы данных в целом.
         */
        public databaseLocked: boolean = false;

        /**
         * @var База только для чтения.
         */
        public readOnly: boolean = false;
    } // class DatabaseInfo

    /**
     * Информация о запущенном на ИРБИС-сервере процессе.
     */
    export class ProcessInfo {
        /**
         * @var Просто порядковый номер в списке.
         */
        public number: string = '';

        /**
         * @var С каким клиентом взаимодействует.
         */
        public ipAddress: string = '';

        /**
         * @var Логин оператора.
         */
        public name: string = '';

        /**
         * @var Идентификатор клиента.
         */
        public clientId: string = '';

        /**
         * @var Тип АРМ.
         */
        public workstation: string = '';

        /**
         * @var Время запуска.
         */
        public started: string = '';

        /**
         * @var Последняя выполненная
         * (или выполняемая) команда.
         */
        public lastCommand: string = '';

        /**
         * @var Порядковый номер последней команды.
         */
        public commandNumber: string = '';

        /**
         * @var Индентификатор процесса.
         */
        public processId: string = '';

        /**
         * @var Состояние.
         */
        public state: string = '';

        public static parse(lines: string[]) : ProcessInfo[] {
            // TODO implement
            return [];
        }

    } // class ProcessInfo

    /**
     * Информация о версии ИРБИС-сервера.
     */
    export class VersionInfo {
        /**
         * @var На какое юридическое лицо приобретен сервер.
         */
        public organization: string = '';

        /**
         * @var Собственно версия сервера. Например, 64.2008.1
         */
        public version: string = '';

        /**
         * @var Максимальное количество подключений.
         */
        public maxClients: number = 0;

        /**
         * @var Текущее количество подключений.
         */
        public connectedClients: number = 0;

        /**
         * Разбор ответа сервера.
         *
         * @param lines Строки с ответом сервера.
         */
        public parse(lines: string[]) : void {
            if (lines.length == 3) {
                this.version = lines[0];
                this.connectedClients = parseInt(lines[1]);
                this.maxClients = parseInt(lines[2]);
            } else {
                this.organization = lines[0];
                this.version = lines[1];
                this.connectedClients = parseInt(lines[2]);
                this.maxClients = parseInt(lines[3]);
            }
        }

    } // class VersionInfo

    /**
     * Информация о клиенте, подключенном к серверу ИРБИС
     * (не обязательно о текущем).
     */
    export class ClientInfo {
        /**
         * @var Порядковый номер.
         */
        public number: string = '';

        /**
         * @var Адрес клиента.
         */
        public ipAddress: string = '';

        /**
         * @var Порт клиента.
         */
        public port: string = '';

        /**
         * @var Логин.
         */
        public name: string = '';

        /**
         * @var Идентификатор клиентской программы
         * (просто уникальное число).
         */
        public id: string = '';

        /**
         * @var Клиентский АРМ.
         */
        public workstation: string = '';

        /**
         * @var Момент подключения к серверу.
         */
        public registered: string = '';

        /**
         * @var Последнее подтверждение,
         * посланное серверу.
         */
        public acknowledged: string = '';

        /**
         * @var Последняя команда, посланная серверу.
         */
        public lastCommand: string = '';

        /**
         * @var Номер последней команды.
         */
        public commandNumber: string = '';

        /**
         * Разбор ответа сервера.
         *
         * @param lines Строки ответа.
         */
        public parse(lines: string[]) : void {
            this.number        = lines[0];
            this.ipAddress     = lines[1];
            this.port          = lines[2];
            this.name          = lines[3];
            this.id            = lines[4];
            this.workstation   = lines[5];
            this.registered    = lines[6];
            this.acknowledged  = lines[7];
            this.lastCommand   = lines[8];
            this.commandNumber = lines[9];
        }

    } // class ClientInfo

    /**
     * Информация о зарегистрированном пользователе системы
     * (по данным client_m.mnu).
     */
    export class UserInfo {
        /**
         * @var Номер по порядку в списке.
         */
        public number: string = '';

        /**
         * @var Логин.
         */
        public name: string = '';

        /**
         * @var Пароль.
         */
        public password: string = '';

        /**
         * @var Доступность АРМ Каталогизатор.
         */
        public cataloger: string = '';

        /**
         * @var АРМ Читатель.
         */
        public reader: string = '';

        /**
         * @var АРМ Книговыдача.
         */
        public circulation: string = '';

        /**
         * @var АРМ Комплектатор.
         */
        public acquisitions: string = '';

        /**
         * @var АРМ Книгообеспеченность.
         */
        public provision: string = '';

        /**
         * @var АРМ Администратор.
         */
        public administrator: string = '';

        public static formatPair(prefix: string, value: string, defaultValue: string) {
            if (sameString(value, defaultValue)) {
                return '';
            }

            return prefix + '=' + value + ';';
        }

        /**
         * Формирование строкового представления пользователя.
         *
         * @return string
         */
        public encode() {
            return this.name + "\r\n"
                + this.password + "\r\n"
                + UserInfo.formatPair('C', this.cataloger,     'irbisc.ini')
                + UserInfo.formatPair('R', this.reader,        'irbisr.ini')
                + UserInfo.formatPair('B', this.circulation,   'irbisb.ini')
                + UserInfo.formatPair('M', this.acquisitions,  'irbism.ini')
                + UserInfo.formatPair('K', this.provision,     'irbisk.ini')
                + UserInfo.formatPair('A', this.administrator, 'irbisa.ini');
        }

        /**
         * Разбор ответа сервера.
         *
         * @param lines Строки ответа сервера.
         * @return array
         */
        public static parse(lines: string[]) : UserInfo[] {
            let result = [];
            let userCount = parseInt(lines[0]);
            let linesPerUser = parseInt(lines[1]);
            if (!userCount || !linesPerUser) {
                return result;
            }

            lines = lines.slice(2);
            for(let i: number = 0; i < userCount; i++) {
                if (lines.length == 0) {
                    break;
                }

                let user = new UserInfo();
                user.number        = lines[0];
                user.name          = lines[1];
                user.password      = lines[2];
                user.cataloger     = lines[3];
                user.reader        = lines[4];
                user.circulation   = lines[5];
                user.acquisitions  = lines[6];
                user.provision     = lines[7];
                user.administrator = lines[8];
                result.push(user);

                lines = lines.slice(linesPerUser + 1);
            }

            return result;
        }
    } // class UserInfo

    /**
     * Данные для метода printTable.
     */
    export class TableDefinition {
        /**
         * @var Имя базы данных.
         */
        public database: string = '';

        /**
         * @var Имя таблицы.
         */
        public table: string = '';

        /**
         * @var Заголовки таблицы.
         */
        public headers: string[] = [];

        /**
         * @var Режим таблицы.
         */
        public mode: string = '';

        /**
         * @var Поисковый запрос.
         */
        public searchQuery: string = '';

        /**
         * @var Минимальный MFN.
         */
        public minMfn: number = 0;

        /**
         * @var Максимальный MFN.
         */
        public maxMfn: number = 0;

        /**
         * @var Запрос для последовательного поиска.
         */
        public sequentialQuery: string = '';

        /**
         * @var Список MFN, по которым строится таблица.
         */
        public mfnList: string[] = [];

    } // class TableDefinition

    /**
     * Статистика работы ИРБИС-сервера.
     */
    export class ServerStat {
        /**
         * @var Подключенные клиенты.
         */
        public runningClients: ClientInfo[] = [];

        /**
         * @var Число клиентов, подключенных в текущий момент.
         */
        public clientCount: number = 0;

        /**
         * @var Общее количество команд,
         * исполненных сервером с момента запуска.
         */
        public totalCommandCount: number = 0;

        /**
         * Разбор ответа сервера.
         *
         * @param lines Строки ответа сервера.
         */
        public parse(lines: string[]) {
            this.totalCommandCount = parseInt(lines[0]);
            this.clientCount = parseInt(lines[1]);
            let linesPerClient = parseInt(lines[2]);
            if (!linesPerClient) {
                return;
            }

            lines = lines.slice(3);

            for(let i=0; i < this.clientCount; i++) {
                let client = new ClientInfo();
                client.parse(lines);
                this.runningClients.push(client);
                lines = lines.slice(linesPerClient + 1);
            }
        }

    } // class ServerStat

    /**
     * Параметры для запроса постингов с сервера.
     */
    export class PostingParameters {
        /**
         * @var База данных.
         */
        public database: string = '';

        /**
         * @var Номер первого постинга.
         */
        public firstPosting: number = 1;

        /**
         * @var Формат.
         */
        public format: string = '';

        /**
         * @var Требуемое количество постингов.
         */
        public numberOfPostings: number = 0;

        /**
         * @var Термин.
         */
        public term:string = '';

        /**
         * @var Список термов.
         */
        public listOfTerms: string[] = [];

    } // class PostingParameters

    /**
     * Параметры для запроса терминов с сервера.
     */
    export class TermParameters {
        /**
         * @var Имя базы данных.
         */
        public database: string = '';

        /**
         * @var Количество считываемых терминов.
         */
        public numberOfTerms: number = 0;

        /**
         * @var Возвращать в обратном порядке?
         */
        public reverseOrder: boolean = false;

        /**
         * @var Начальный термин.
         */
        public startTerm: string = '';

        /**
         * @var Формат.
         */
        public format: string = '';

    } // class TermParameters

    /**
     * Информация о термине поискового словаря.
     */
    export class TermInfo {
        /**
         * @var Количество ссылок.
         */
        public count: number = 0;

        /**
         * @var Поисковый термин.
         */
        public text: string = '';

        public static parse(lines: string[]): TermInfo[] {
            let result = [];
            for(let line of lines) {
                if (line) {
                    let parts = line.split('#', 2);
                    let term = new TermInfo();
                    term.count = parseInt(parts[0]);
                    term.text = parts[1];
                    result.push(term);
                }
            }

            return result;
        }

    } // class TermInfo

    /**
     * Постинг термина в поисковом индексе.
     */
    export class TermPosting {
        /**
         * @var MFN записи с искомым термином.
         */
        public mfn: number = 0;

        /**
         * @var Метка поля с искомым термином.
         */
        public tag: number = 0;

        /**
         * @var Повторение поля.
         */
        public occurrence: number = 0;

        /**
         * @var Количество повторений.
         */
        public count: number = 0;

        /**
         * @var Результат форматирования.
         */
        public text: string = '';

        /**
         * Разбор ответа сервера.
         *
         * @param lines Строки ответа.
         * @return Массив постингов.
         */
        public static parse(lines: string) : TermPosting[] {
            let result = [];
            for (let line of lines) {
                let parts = line.split('#', 5);
                if (parts.length < 4) {
                    break;
                }

                let item = new TermPosting();
                item.mfn        = parseInt(parts[0]);
                item.tag        = parseInt(parts[1]);
                item.occurrence = parseInt(parts[2]);
                item.count      = parseInt(parts[3]);
                item.text       = parts[4];
                result.push(item);
            }

            return result;
        }

    } // class TermPosting

    /**
     * Параметры для поиска записей (метод searchEx).
     */
    export class SearchParameters {
        /**
         * @var Имя базы данных.
         */
        public database: string = '';

        /**
         * @var Индекс первой требуемой записи.
         */
        public firstRecord: number = 1;

        /**
         * @var Формат для расформатирования записей.
         */
        public format: string = '';

        /**
         * @var Максимальный MFN.
         */
        public maxMfn: number = 0;

        /**
         * @var int Минимальный MFN.
         */
        public minMfn: number = 0;

        /**
         * @var Общее число требуемых записей.
         */
        public numberOfRecords: number = 0;

        /**
         * @var Выражение для поиска по словарю.
         */
        public expression: string = '';

        /**
         * @var Выражение для последовательного поиска.
         */
        public sequential: string = '';

        /**
         * @var Выражение для локальной фильтрации.
         */
        public filter: string = '';

        /**
         * @var Признак кодировки UTF-8.
         */
        public isUtf: boolean = false;

        /**
         * @var Признак вложенного вызова.
         */
        public nested: boolean = false;

    } // class SearchParameters

    /**
     * Сценарий поиска.
     */
    export class SearchScenario {
        /**
         * @var Название поискового атрибута
         * (автор, инвентарный номер).
         */
        public name: string = '';

        /**
         * @var Префикс соответствующих терминов
         * в словаре (может быть пустым).
         */
        public prefix: string = '';

        /**
         * @var Тип словаря для соответствующего поиска.
         */
        public dictionaryType: number = 0;

        /**
         * @var Имя файла справочника.
         */
        public menuName: string = '';

        /**
         * @var Имя формата (без расширения).
         */
        public oldFormat: string = '';

        /**
         * @var Способ корректировки по словарю.
         */
        public correction: string = '';

        /**
         * @var Исходное положение переключателя "Усечение".
         */
        public truncation: string = '';

        /**
         * @var Текст подсказки/предупреждения.
         */
        public hint: string = '';

        /**
         * @var Параметр пока не задействован.
         */
        public modByDicAuto: string = '';

        /**
         * @var Применимые логические операторы.
         */
        public logic: string = '';

        /**
         * @var Правила автоматического расширения поиска
         * на основе авторитетного файла или тезауруса.
         */
        public advance: string = '';

        /**
         * @var Имя формата показа документов.
         */
        public format: string = '';

        /**
         * Разбор INI-файла.
         *
         * @param iniFile
         * @return array
         */
        public static parse(iniFile: IniFile) : SearchScenario[] {
            let result = [];

            // TODO implement

            return result
        }

    } // class SearchScenario

    /**
     * PAR-файл -- содержит пути к файлам базы данных ИРБИС.
     */
    export class ParFile {

        // Пример файла IBIS.PAR:
        //
        // 1=.\datai\ibis\
        // 2=.\datai\ibis\
        // 3=.\datai\ibis\
        // 4=.\datai\ibis\
        // 5=.\datai\ibis\
        // 6=.\datai\ibis\
        // 7=.\datai\ibis\
        // 8=.\datai\ibis\
        // 9=.\datai\ibis\
        // 10=.\datai\ibis\
        // 11=f:\webshare\

        /**
         * @var Путь к файлу XRF.
         */
        public xrf: string = '';

        /**
         * @var Путь к файлу MST.
         */
        public mst: string = '';

        /**
         * @var Путь к файлу CNT.
         */
        public cnt: string = '';

        /**
         * @var Путь к файлу N01.
         */
        public n01: string = '';

        /**
         * @var В ИРБИС64 не используется.
         */
        public n02: string = '';

        /**
         * @var Путь к файлу L01.
         */
        public l01: string = '';

        /**
         * @var В ИРБИС64 не используется.
         */
        public l02: string = '';

        /**
         * @var Путь к файлу IFP.
         */
        public ifp: string = '';

        /**
         * @var Путь к файлу ANY.
         */
        public any: string = '';

        /**
         * @var Путь к PFT-файлам.
         */
        public pft: string = '';

        /**
         * @var Расположение внешних объектов (поле 951).
         * Параметр появился в версии 2012.
         */
        public ext: string = '';

        /**
         * ParFile constructor.
         * @param mst Путь к MST-файлу.
         */
        public constructor(mst: string = '') {
            this.mst = mst;
            this.xrf = mst;
            this.cnt = mst;
            this.l01 = mst;
            this.l02 = mst;
            this.n01 = mst;
            this.n02 = mst;
            this.ifp = mst;
            this.any = mst;
            this.pft = mst;
            this.ext = mst;
        }

        /**
         * Разбор ответа сервера.
         *
         * @param lines Ответ сервера.
         * @throws IrbisException
         */
        public parse(lines: string[]) : void {
            let map = {};
            for (let line of lines) {
                if (!line) {
                    continue;
                }

                let parts = line.split('=', 2);
                if (parts.length != 2) {
                    continue;
                }

                let key = parts[0].trim();
                let value = parts[1].trim();
                map[key] = value;
            }

            this.xrf = map['1'];
            this.mst = map['2'];
            this.cnt = map['3'];
            this.n01 = map['4'];
            this.n02 = map['5'];
            this.l01 = map['6'];
            this.l02 = map['7'];
            this.ifp = map['8'];
            this.any = map['9'];
            this.pft = map['10'];
            this.ext = map['11'];
        }

    } // class ParFile

    /**
     * Строка OPT-файла.
     */
    export class OptLine {
        /**
         * @var Паттерн.
         */
        public pattern: string = '';

        /**
         * @var Соответствующий рабочий лист.
         */
        public worksheet: string = '';

        public parse(text: string) {
            let parts = text.trim().split(/\s+/, 2);
            if (parts.length != 2) {
                // throw new IrbisException();
            }

            this.pattern = parts[0];
            this.worksheet = parts[1];
        }

    } // class OptLine

    /**
     * OPT-файл -- файл оптимизации рабочих листов и форматов показа.
     */
    export class OptFile {
        // Пример OPT-файла
        //
        // 920
        // 5
        // PAZK  PAZK42
        // PVK   PVK42
        // SPEC  SPEC42
        // J     !RPJ51
        // NJ    !NJ31
        // NJP   !NJ31
        // NJK   !NJ31
        // AUNTD AUNTD42
        // ASP   ASP42
        // MUSP  MUSP
        // SZPRF SZPRF
        // BOUNI BOUNI
        // IBIS  IBIS
        // +++++ PAZK42
        // *****

        /**
         * @var Длина рабочего листа.
         */
        public worksheetLength: number = 5;

        /**
         * @var Метка поля рабочего листа.
         */
        public worksheetTag: number = 920;

        /**
         * @var Строки с паттернами.
         */
        public lines: OptLine[] = [];

        /**
         * Получение рабочего листа записи.
         *
         * @param record Запись
         * @return Рабочий лист.
         */
        public getWorksheet(record: MarcRecord) : string {
            return record.fm(this.worksheetTag);
        }

        /**
         * Разбор ответа сервера.
         *
         * @param lines Строки OPT-файла.
         * @throws IrbisException
         */
        public parse(lines: string[]) : void {
            this.worksheetTag = parseInt(lines[0]);
            this.worksheetLength = parseInt(lines[1]);
            lines = lines.slice(2);
            for (let line of lines) {
                if (!line) {
                    continue;
                }

                if (line[0] == '*') {
                    break;
                }

                let item = new OptLine();
                item.parse(line);
                this.lines.push(item);
            }
        }

        public static sameChar(pattern: string, testable: string) : boolean {
            if (pattern == '+') {
                return true;
            }

            return pattern.toUpperCase() == testable.toUpperCase();
        }

        /**
         * Сопоставление строки с OPT-шаблоном.
         *
         * @param pattern Шаблон.
         * @param testable Проверяемая строка.
         * @return Совпало?
         */
        public static sameText(pattern: string, testable: string) : boolean {
            if (!pattern) {
                return false;
            }

            if (!testable) {
                return pattern[0] == '+';
            }

            let patternIndex: number = 0;
            let testableIndex: number = 0;
            while (true) {
                let patternChar: string = pattern[patternIndex];
                let testableChar: string = testable[testableIndex];
                let patternNext = patternIndex++ < pattern.length;
                let testableNext = testableIndex++ < testable.length;

                if (patternNext && !testableNext) {
                    if (patternChar == '+') {
                        while (patternIndex < pattern.length) {
                            patternChar = pattern[patternIndex];
                            patternIndex++;
                            if (patternChar != '+') {
                                return false;
                            }
                        }

                        return true;
                    }
                }

                if (patternNext != testableNext) {
                    return false;
                }

                if (!patternNext) {
                    return true;
                }

                if (!OptFile.sameChar(patternChar, testableChar)) {
                    return false;
                }
            }
        }

        /**
         * Подбор значения для указанного текста.
         *
         * @param text Проверяемый текст.
         * @return Найденное значение либо null.
         */
        public resolveWorksheet(text: string) : string {
            for (let line of this.lines) {
                if (OptFile.sameText(line.pattern, text)) {
                    return line.worksheet;
                }
            }

            return null;
        }

    } // class OptFile

    /**
     * Клиентский запрос.
     */
    export class ClientQuery {

        /**
         * Буфер для хранения сформированного запроса.
         */
        private buffer: Buffer;

        constructor(connection: Connection, command: string) {
            this.buffer = Buffer.alloc(100);

            this.addAnsi(command).newLine();
            this.addAnsi(connection.workstation).newLine();
            this.addAnsi(command).newLine();
            this.add(connection.clientId).newLine();
            this.add(connection.queryId).newLine();
            this.addAnsi(connection.password).newLine();
            this.addAnsi(connection.username).newLine();
            this.newLine();
            this.newLine();
            this.newLine();
        }

        /**
         * Добавляем целое число
         * (по факту выходит кодировка ANSI).
         *
         * @param value Число
         * @return this
         */
        public add(value: number) : ClientQuery {
            return this.addAnsi(value.toString());
        }

        /**
         * Добавляем текст в кодировке ANSI.
         * @param value
         * @return this
         */
        public addAnsi(value: string) : ClientQuery {
            let tail = cp1251_from_unicode(value);
            this.buffer = Buffer.concat([this.buffer, tail]);

            return this;
        }

        /**
         * Добавляем текст в кодировке UTF-8.
         * @param value
         * @return this
         */
        public addUtf(value: string) : ClientQuery {
            let tail = utf8_from_unicode(value);
            this.buffer = Buffer.concat([this.buffer, tail]);

            return this;
        }

        /**
         *  Отладочный вывод.
         */
        public debugDump() : void {
            console.log(this.buffer);
        } // method debugDump

        /**
         * Добавляем перевод строки.
         * @return this
         */
        public newLine() : ClientQuery {
            let tail = Buffer.from([10]);
            this.buffer = Buffer.concat([this.buffer, tail]);

            return this;
        } // method newLine

        public toString() : string {
            return this.buffer.toString();
        }

    } // class ClientQuery

    /**
     * Ответ сервера.
     */
    export class ServerResponse {
        /**
         * Код команды (дублирует запрос).
         */
        public command: string = '';

        /**
         * Идентификатор клиента (дублирует запрос).
         */
        public clientId: number = 0;

        /**
         * Номер команды (дублирует запрос).
         */
        public queryId: number = 0;

        /**
         * Код вовзрата (бывает не у всех ответов).
         */
        public returnCode: number = 0;

        /**
         * Размер ответа в байтах.
         * В некоторых сценариях не возвращается.
         */
        public answerSize: number = 0;

        /**
         * Версия сервера.
         * В некоторых сценариях не возвращается.
         */
        public serverVersion: string = '';

        /**
         * Буфер с ответом сервера.
         */
        private buffer: Buffer;

        /**
         * Текущее смещение в ответе сервера.
         */
        private offset: number;

        private bufferLength: number;

        constructor(socket) {
            this.buffer = Buffer.from([]);

            // TODO read the socket

            this.offset = 0;
            this.bufferLength = this.buffer.length;

            this.command = this.readAnsi();
            this.clientId = this.readInteger();
            this.queryId = this.readInteger();
            this.answerSize = this.readInteger();
            this.serverVersion = this.readAnsi();
            for (let i = 0; i < 5; i++) {
                this.readAnsi();
            }
        }

        /**
         * Проверка кода возврата.
         *
         * @param codes Разрешённые коды возврата.
         */
        public checkReturnCode(codes? : number[]) : void {
            if (this.getReturnCode() < 0) {
                if (codes && (codes.indexOf(this.returnCode) < 0)) {
                    throw this.returnCode; // TODO fix
                }
            }
        }

        /**
         * Отладочная печать.
         * @param debug
         */
        public debug(debug: boolean) {
            if (debug) {
                console.log(this.buffer);
            }
        }

        /**
         * Чтение строки без преобразования кодировок.
         */
        public getLine() : Buffer {
            let current = this.offset;
            let delta = 0;
            while (current < this.bufferLength) {
                if (this.buffer[current] == 13) {
                    delta = 1;
                    if (this.buffer[current + 1] == 10) {
                        delta = 2;
                    }
                    break;
                }
                current++;
            }

            let result = this.buffer.slice(this.offset, current);
            this.offset += delta;

            return result;
        }

        /**
         * Получение кода возврата.
         * Вызывается один раз в свой час и только тогда.
         * Отрицательное число свидетельствует о проблеме.
         */
        public getReturnCode() : number {
            this.returnCode = this.readInteger();

            return this.returnCode;
        }

        /**
         * Чтение строки в кодировке ANSI.
         */
        public readAnsi() : string {
            let line = this.getLine();
            return line.toString(ANSI_ENCODING);
        }

        /**
         * Чтение целого числа.
         */
        public readInteger() : number {
            let line = this.readAnsi();
            return parseInt(line);
        }

        /**
         * Получение оставшихся байтов без преобразования кодировок.
         */
        public readRemaining() : Buffer {
            return this.buffer.slice(this.offset);
        }

        /**
         * Получение оставшихся строк в кодировке ANSI.
         */
        public readRemainingAnsiLines() : string[] {
            let text = this.readRemainingAnsiText();
            return text.split("\n");
        }

        /**
         * Получение оставшегося текста в кодировке ANSI.
         */
        public readRemainingAnsiText() : string {
            let buffer = this.readRemaining();
            return buffer.toString(ANSI_ENCODING);
        }

        /**
         * Чтение оставшихся строк в кодировке UTF.
         */
        public readRemainingUtfLines() : string[] {
            let text = this.readRemainingUtfText();
            return text.split("\n");
        }

        /**
         * Получение оставшегося текста в кодировке UTF.
         */
        public readRemainingUtfText() : string {
            let buffer = this.readRemaining();
            return buffer.toString(UTF_ENCODING);
        }

        /**
         * Чтение строки в кодировке UTF.
         */
        public readUtf() : string {
            let line = this.getLine();
            let result = line.toString(UTF_ENCODING);

            return result;
        }
    } // class ServerResponse

    /**
     * Подключение к ИРБИС-серверу.
     */
    export class Connection {
        /**
         * Адрес сервера (можно как my.domain.com,
         * так и 192.168.1.1).
         */
        public host: string = '127.0.0.1';

        /**
         * Порт сервера.
         */
        public port: number = 6666;

        /**
         * Логин пользователя. Регистр символов не учитывается.
         */
        public username: string = '';

        /**
         * Пароль пользователя. Регистр символов учитывается.
         */
        public password: string = '';

        /**
         * Имя текущей базы данных.
         */
        public database: string = 'IBIS';

        /**
         * Код АРМа.
         */
        public workstation: string = CATALOGER;

        /**
         * Идентификатор клиента.
         * Задаётся автоматически при подключении к серверу.
         */
        public clientId: number = 0;

        /**
         * Последовательный номер запроса к сервера.
         * Ведётся автоматически.
         */
        public queryId: number = 0;

        /**
         * Версия сервера (доступна после подключения).
         */
        public serverVersion: string = '';

        /**
         * Серверный INI-файл (доступен после подключения).
         */
        public iniFile = null;

        /**
         * Интервал подтверждения, минуты
         * (доступен после подключения).
         */
        public interval: number = 0;

        private connected: boolean = false;

        /**
         * Признак отладки.
         */
        private debugFlag: boolean = false;

        /**
         * Актуализация записи с указанным MFN.
         *
         * @param database Имя базы данных.
         * @param mfn MFN, подлежащий актуализации.
         * @return boolean Признак успешности операции.
         */
        public async actualizeRecord(database: string, mfn: number) : Promise<boolean> {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'F');
            query.addAnsi(database).newLine();
            query.add(mfn).newLine();
            let response = await this.execute(query);
            response.checkReturnCode();

            return true;
        } // method actualizeRecord

        /**
         * Подключение к серверу ИРБИС64.
         * @return boolean Признак успешности операции.
         */
        public async connect() : Promise<boolean> {
            if (this.connected) {
                return true;
            }

            while (true) {
                this.clientId = 100000 + Math.floor(Math.random() * 900000);
                this.queryId = 1;

                let query = new ClientQuery(this, 'A');
                query.addAnsi(this.username).newLine();
                query.addAnsi(this.password);

                let response = await this.execute(query);
                response.getReturnCode();
                if (response.returnCode == -3337) {
                    continue;
                }

                if (response.returnCode < 0) {
                    return false;
                }

                this.connected = true;
                this.serverVersion = response.serverVersion;
                this.interval = parseInt(response.readUtf());
                this.iniFile = null; // TODO implement

                return true;
            }
        } // method connect

        /**
         * Создание базы данных.
         *
         * @param database Имя создаваемой базы.
         * @param description Описание в свободной форме.
         * @param readerAccess Читатель будет иметь доступ?
         * @return boolean Признак успешности операции.
         */
        public async createDatabase(database: string, description: string, readerAccess: number = 1) : Promise<boolean> {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'T');
            query.addAnsi(database).newLine();
            query.addAnsi(description).newLine();
            query.add(readerAccess).newLine();

            let response = await this.execute(query);
            response.checkReturnCode();

            return true;
        } // method createDatabase

        /**
         * Создание словаря в указанной базе данных.
         *
         * @param database Имя базы данных.
         * @return boolean Признак успешности операции.
         */
        public async createDictionary(database: string) : Promise<boolean> {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'Z');
            query.addAnsi(database).newLine();
            let response = await this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Удаление указанной базы данных.
         *
         * @param database Имя удаляемой базы данных.
         * @return boolean Признак успешности операции.
         */
        public async deleteDatabase(database: string) : Promise<boolean> {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'W');
            query.addAnsi(database).newLine();
            let response = await this.execute(query);
            response.checkReturnCode();

            return true;
        } // method deleteDatabase

        /**
         * Удаление записи по её MFN.
         *
         * @param mfn MFN удаляемой записи.
         * @return boolean Признак успешности операции.
         */
        public async deleteRecord(mfn: number) : Promise<boolean> {
            let record = await this.readRecord(mfn);
            if (!record) {
                return false;
            }

            if (!record.isDeleted()) {
                record.status |= LOGICALLY_DELETED;
                await this.writeRecord(record);
            }

            return true;
        } // method deleteRecord

        /**
         *  Отключение от сервера.
         *
         *  @return boolean Признак успешности операции
         *  (по факту всегда true).
         */
        public async disconnect() : Promise<boolean> {
            if (!this.connected) {
                return true;
            }

            let query = new ClientQuery(this, 'B');
            query.addAnsi(this.username);
            await this.execute(query);
            this.connected = false;

            return true;
        }

        /**
         * Отправка клиентского запроса на сервер
         * и получение от него.
         *
         * @param query Клиентский запрос.
         * @return ServerResponse Ответ сервера.
         */
        public async execute(query: ClientQuery) : Promise<ServerResponse> {
            // TODO implement

            query.debugDump();
            const payload = query.toString();
            let client = await net.createConnection(this.port, this.host);

            this.queryId++;

            return new ServerResponse(123);
        }

        /**
         * Форматирование записи с указанным MFN.
         *
         * @param format Текст формата.
         * @param mfn MFN записи
         * @throws IrbisException
         * @return Результат расформатирования
         */
        public async formatRecord(format: string, mfn: number) : Promise<string> {
            if (!this.connected) {
                return '';
            }

            let query = new ClientQuery(this, 'G');
            query.addAnsi(this.database).newLine();
            let prepared = prepareFormat(format);
            query.addAnsi(prepared).newLine();
            query.add(1).newLine();
            query.add(mfn).newLine();
            let response = await this.execute(query);
            response.checkReturnCode();
            let result = response.readRemainingUtfText();

            return result;
        }

        /**
         * Получение максимального MFN для указанной базы данных.
         *
         * @param database Имя базы данных.
         * @throws IrbisException
         * @return Максимальный MFN или 0 при ошибке.
         */
        public async getMaxMfn(database: string) : Promise<number> {
            if (!this.connected) {
                return 0;
            }

            let query = new ClientQuery(this, 'O');
            query.addAnsi(database);
            let response = await this.execute(query);
            response.checkReturnCode();

            return response.returnCode;
        }

        /**
         * Получение списка файлов.
         *
         * @param specification Спецификация.
         * @return Массив строк с именами файлов.
         */
        public async listFiles(specification: string) : Promise<string[]> {
            if (!this.connected) {
                return [];
            }
            
            let query = new ClientQuery(this, '!');
            query.addAnsi(specification).newLine();
            let response = await this.execute(query);
            let lines = response.readRemainingAnsiLines();
            let result = [];
            for (let line of lines) {
                // TODO implement
                result.push(line);
            }
            
            return result;
        }

        /**
         * Получение статуса, подключен ли клиент в настоящее время.
         *
         * @return boolean Подключен?
         */
        public isConnected() : boolean {
            return this.connected;
        }

        /**
         * Пустая операция (используется для периодического
         * подтверждения подключения клиента).
         *
         * @return Всегда true при наличии подключения,
         * т. к. код возврата не анализируется.
         * Всегда false при отсутствии подключения.
         */
        public async noOp() : Promise<boolean> {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'N');
            await this.execute(query);

            return true;
        }

        /**
         * Разбор строки подключения.
         *
         * @param connectionString Строка подключения.
         * @throws IrbisException
         */
        public parseConnectionString(connectionString: string) : void {
            // TODO implement
        }

        /**
         * Чтение указанной записи.
         *
         * @return bool|MarcRecord
         * @throws IrbisException
         * @param mfn
         */
        public async readRecord(mfn: number) : Promise<MarcRecord> {
            if (!this.connected) {
                return null;
            }

            let query = new ClientQuery(this, 'C');
            query.addAnsi(this.database).newLine();
            query.add(mfn).newLine();
            let response = await this.execute(query);
            response.checkReturnCode(readRecordCodes());
            let result = new MarcRecord();
            result.decode(response.readRemainingUtfLines());
            result.database = this.database;

            return result;
        } // method readRecord

        /**
         * Простой поиск записей.
         *
         * @param expression Выражение для поиска по словарю.
         * @return array|bool
         * @throws IrbisException
         */
        public async search(expression: string) : Promise<number[]> {
            let parameters = new SearchParameters();
            parameters.expression = expression;
            let found = await this.searchEx(parameters);
            let result = FoundLine.toMfn(found);

            return result;
        } // method search

        /**
         * Поиск записей.
         *
         * @param parameters Параметры поиска.
         * @return array|bool
         * @throws IrbisException
         */
        public async searchEx(parameters: SearchParameters) : Promise<FoundLine[]> {
            // TODO implement
            return [];
        }

        /**
         * Поиск записей с их одновременным считыванием.
         *
         * @param expression Поисковое выражение.
         * @param limit Максимальное количество загружаемых записей.
         * @return array
         * @throws IrbisException
         */
        public async searchRead(expression: string, limit: number = 0) : Promise<MarcRecord[]> {
            let parameters = new SearchParameters();
            parameters.expression = expression;
            parameters.format = ALL_FORMAT;
            parameters.numberOfRecords = limit;
            let found = await this.searchEx(parameters);
            if (!found) {
                return [];
            }

            let result = [];
            for (let item of found) {
                let lines = item.description.split("\x1F");
                lines = lines.slice(1);
                let record = new MarcRecord();
                record.decode(lines);
                record.database = this.database;
                result.push(record);
            }

            return result;
        }

        /**
         * Поиск и считывание одной записи, соответствующей выражению.
         * Если таких записей больше одной, то будет считана любая из них.
         * Если таких записей нет, будет возвращен null.
         *
         * @param expression Поисковое выражение.
         * @return MarcRecord|null
         * @throws IrbisException
         */
        public async searchSingleRecord(expression: string) : Promise<MarcRecord> {
            let found = await this.searchRead(expression, 1);
            if (found.length != 0) {
                return found[0];
            }

            return null;
        }

        /**
         * Выдача строки подключения для текущего соединения.
         *
         * @return Строка подключения.
         */
        public toConnectionString() : string {
            return 'host='     + this.host
                + ';port='     + this.port
                + ';username=' + this.username
                + ';password=' + this.password
                + ';database=' + this.database
                + ';arm='      + this.workstation + ';';
        }

        /**
         * Опустошение указанной базы данных.
         *
         * @param database База данных.
         * @return Признак успешности операции
         */
        public async truncateDatabase(database: string) : Promise<boolean> {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'S');
            query.addAnsi(database).newLine();
            await this.execute(query);

            return true;
        }

        /**
         * Разблокирование указанной базы данных.
         *
         * @param string $database База данных.
         * @return bool
         */
        public async unlockDatabase(database: string) : Promise<boolean> {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'U');
            query.addAnsi(database).newLine();
            await this.execute(query);

            return true;
        }

        /**
         * Восстановление записи по её MFN.
         *
         * @param mfn MFN восстанавливаемой записи.
         * @return MarcRecord
         * @throws IrbisException
         */
        public async undeleteRecord(mfn: number) : Promise<MarcRecord> {
            let record = await this.readRecord(mfn);
            if (!record) {
                return record;
            }

            if (record.isDeleted()) {
                record.status &= ~LOGICALLY_DELETED;
                await this.writeRecord(record);
            }

            return record;
        } // method undeleteRecord

        /**
         * Разблокирование записей.
         *
         * @param database База данных.
         * @param mfnList Массив MFN.
         * @return Признак успешности операции.
         */
        public async unlockRecords(database : string, mfnList: number[]) : Promise<boolean> {
            if (this.connected) {
                return false;
            }

            if (mfnList.length == 0) {
                return true;
            }

            if (isNullOrEmpty(database)) {
                database = this.database;
            }

            let query = new ClientQuery(this, 'Q');
            query.addAnsi(database).newLine();
            for (let mfn of mfnList) {
                query.add(mfn).newLine();
            }

            await this.execute(query);

            return true;
        }

        /**
         * Сохранение записи на сервере.
         *
         * @param record Запись для сохранения (новая или ранее считанная).
         * @param lockFlag Оставить запись заблокированной?
         * @param actualize Актуализировать словарь?
         * @param dontParse Не разбирать результат.
         * @throws IrbisException
         * @return Новый максимальный MFN или 0 при ошибке.
         */
        public async writeRecord(record: MarcRecord, lockFlag: number = 0, actualize: number = 1,
            dontParse: boolean = false) : Promise<number> {
            if (!this.connected) {
                return 0;
            }

            let database = record.database;
            if (isNullOrEmpty(database)) {
                database = this.database;
            }
            let query = new ClientQuery(this, 'D');
            query.addAnsi(database).newLine();
            query.add(lockFlag).newLine();
            query.add(actualize).newLine();
            query.addUtf(record.encode()).newLine();
            let response = await this.execute(query);
            response.checkReturnCode();
            if (!dontParse) {
                record.fields = [];
                let temp = response.readRemainingUtfLines();
                let lines = [temp[0]];
                // lines = array_merge($lines, explode(SHORT_DELIMITER, $temp[1]));
                record.decode(lines);
                record.database = database;
            }

            return response.returnCode;
        }

        /**
         * Сохранение текстового файла на сервере.
         *
         * @param string $specification Спецификация файла
         * (включая текст файла).
         * @return Признак успешности операции.
         */
        public async writeTextFile(specification: string) : Promise<void> {
            // TODO implement
        }
    } // class Connection

} // module Irbis