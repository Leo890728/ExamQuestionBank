import enum
import re
import io

import pdfplumber


class Flag(enum.Enum):
    BEGIN = -2
    QUESTION = -1
    OPTION_1 = 0
    OPTION_2 = 1
    OPTION_3 = 2
    OPTION_4 = 3


class PDFParser:

    @staticmethod
    def parse_questions(file):
        questions = []
        with pdfplumber.open(io.BytesIO(file.read())) as pdf:
            temp = {
                "question": "",
                "options": [
                    "",
                    "",
                    "",
                    ""
                ]
            }
            
            flag = Flag.BEGIN

            for index, page in enumerate(pdf.pages):
                for word in page.extract_words():
                    if index == 0:
                        if word["bottom"] < 205: # \ue12b禁止使用電子計算器。 此行以下 (只有在第一頁)
                            continue
                    else:
                        if re.fullmatch(r"代號：[0-9]+|頁次：[0-9]+－[0-9]+", word['text']): # 移除代號和頁次
                            print("移除代號和頁次:", word['text'])
                            continue
                            
                    if word['x0'] < 55: # 題號位置
                        if flag != Flag.BEGIN:
                            questions.append(temp)
                            temp = {
                                "question": "",
                                "options": [
                                    "",
                                    "",
                                    "",
                                    ""
                                ]
                            }
                        flag = Flag.QUESTION
                        continue

                    match word["text"][0]:
                        case "\ue18c":
                            flag = Flag.OPTION_1
                        case "\ue18d":
                            flag = Flag.OPTION_2
                        case "\ue18e":
                            flag = Flag.OPTION_3
                        case "\ue18f":
                            flag = Flag.OPTION_4
                        
                    if flag == Flag.QUESTION:
                        temp["question"] += word["text"]
                    else:
                        temp["options"][flag.value] += word["text"].lstrip(u"\ue18c\ue18d\ue18e\ue18f")

            questions.append(temp)
        return questions
    
    def parse_answers(file):
        answers = []
        with pdfplumber.open(io.BytesIO(file.read())) as pdf:
            for page in pdf.pages:
                for table in page.extract_tables():
                    answers.extend(list(filter(lambda a: a, table[1][1:])))
            notes = "".join(re.findall(r"備 註： .*", page.extract_text()))
        
        return {
            "notes": notes,
            "answers": answers
        }