from __future__ import annotations

import argparse
import io
import os
from pathlib import Path

import sherpa_onnx
import soundfile as sf


def _build_tts() -> sherpa_onnx.OfflineTts:
    base_dir = Path(os.environ.get("SHERPA_MATCHA_DIR", "models/matcha-zh-en"))

    acoustic_model = Path(os.environ.get("SHERPA_MATCHA_ACOUSTIC_MODEL", str(base_dir / "model-steps-3.onnx")))
    vocoder = Path(os.environ.get("SHERPA_MATCHA_VOCODER", str(base_dir / "vocos-16khz-univ.onnx")))
    tokens = Path(os.environ.get("SHERPA_MATCHA_TOKENS", str(base_dir / "tokens.txt")))

    lexicon = Path(os.environ.get("SHERPA_MATCHA_LEXICON", str(base_dir / "lexicon.txt")))
    data_dir = Path(os.environ.get("SHERPA_MATCHA_DATA_DIR", str(base_dir / "espeak-ng-data")))

    rule_fsts = os.environ.get(
        "SHERPA_MATCHA_RULE_FSTS",
        ",".join(
            [
                str(base_dir / "phone-zh.fst"),
                str(base_dir / "date-zh.fst"),
                str(base_dir / "number-zh.fst"),
            ]
        ),
    )

    for p in [acoustic_model, vocoder, tokens, lexicon, data_dir]:
        if not p.exists():
            raise FileNotFoundError(f"Missing required model asset: {p}")

    model_config = sherpa_onnx.OfflineTtsModelConfig(
        matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
            acoustic_model=str(acoustic_model),
            vocoder=str(vocoder),
            tokens=str(tokens),
            lexicon=str(lexicon),
            data_dir=str(data_dir),
            dict_dir="",
        ),
        provider="cpu",
        num_threads=int(os.environ.get("TTS_NUM_THREADS", "4")),
        debug=False,
    )

    config = sherpa_onnx.OfflineTtsConfig(
        model=model_config,
        rule_fsts=rule_fsts,
        max_num_sentences=1,
    )

    if hasattr(config, "validate") and not config.validate():
        raise RuntimeError("Invalid sherpa-onnx TTS config")

    return sherpa_onnx.OfflineTts(config)


def _write_wav(path: Path, samples, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format="WAV")
    path.write_bytes(buf.getvalue())


SCRIPTS: dict[str, str] = {
    "00_intro_consent.wav": (
        "嗨，歡迎參加這次的學習活動。\n"
        "接下來大約會花你 10 分鐘左右，系統會請你先看一段影片，然後回答幾個跟「日常生活與永續」有關的小問題。\n"
        "這些回答沒有標準答案，你只要照自己的想法誠實回答就可以。\n"
        "若你不想繼續，隨時可以關閉畫面離開，不會有任何影響。\n"
        "如果你同意參與，請在畫面上點選「我同意」，我們就開始囉。"
    ),
    "01_greeting.wav": "嗨，你好，我是Allen，你怎麼稱呼呢?",
    "02_video_intro_after_name.wav": "很高興認識你。在我們進行討論前，我想先邀請你觀賞這個影片。",
    "03_video_quiz.wav": "你知道影片中主要是在討論哪一個議題的新聞嗎?",
    "04_sustainability_prime_correct.wav": "沒錯，地球其實已經變得越來越脆弱，像是台灣這幾年受到颱風或暴雨侵襲的頻率跟嚴重性也越來越高。如果可以，我想邀請你也嘗試看看從生活中的一些簡單的行動改變來一起為減緩對地球的威脅做努力。",
    "04_sustainability_prime_wrong.wav": "其實影片主要是在談論永續議題喔。不過沒關係，正如影片所提到的，地球其實已經變得越來越脆弱，像是台灣這幾年受到颱風或暴雨侵襲的頻率跟嚴重性也越來越高。如果可以，我想邀請你也嘗試看看從生活中的一些簡單的行動改變來一起為減緩對地球的威脅做努力。",
    "05_action_open.wav": "如果是這些行動，你覺得你可能可以做得到哪些? 使用環保杯、使用環保提袋、減少摩托車或汽車的使用次數來降低生活中的碳排?",
    "06_action_none.wav": "沒關係的，我相信你也有那分心意想要讓地球更好，在接下來的幾天，我也想邀請你在生活中也嘗試看看~雖然不會立刻有效，但我覺得這樣的心意遲早有一天會對我們的地球帶來一些改變",
    "07_behavior_plan_question.wav": "除了這些行動，你覺得你在生活中還有哪些地方可能也可以做到降低碳排?",
    "08_scale_after_none.wav": "接下來有個簡單的測驗想請你回答。",
    "08_scale_after_yes_answered.wav": "很棒，你真的是一個永續人，謝謝你的用心。接下來有個簡單的測驗想請你回答。",
    "08_scale_after_yes_empty.wav": "那也沒關係，原本我跟你說的那些永續行動方法我覺得你一定也可以在生活中嘗試看看，我相信你一定可以成為一個永續人的。接下來有個簡單的測驗想請你回答。",
    "09_org_intro.wav": (
        "另外呀，我也想跟你介紹一個由大學學生一起發起組成的永續行動組織-綠行生活。"
        "綠行生活協會成立於 2021 年，由幾位覺得「永續其實可以更簡單」的大學生一起創立。"
        "那時校園推減塑政策，但不少同學仍覺得永續太麻煩、難以持續。"
        "創辦成員來自不同科系，他們希望能用輕鬆、不施壓的方式，讓大家更容易開始做一些日常的小改變。"
        "\n\n"
        "協會的做法很接地氣。他們每週推出一個「綠行小挑戰」，"
        "像是三天自備飲料杯、一天不拿一次性餐具、短距離改用步行等。"
        "完成挑戰的同學只需要掃個 QR code 或使用 Line bot 就能打卡，"
        "協會會在社群上分享同學的心得與小故事，讓人看到「原來很多人都在嘗試」。"
        "\n\n"
        "校園周邊還有他們合作的「永續行動據點」，例如自備杯折抵、回收物換小禮物，"
        "甚至提供二手交換箱。這些日常可見的場景讓永續不再抽象，而是變得容易、友善、也有回饋感。"
        "\n\n"
        "整體來說，綠行生活協會希望讓大家覺得永續不是額外的負擔，"
        "而是一件可以從生活小步驟慢慢開始的事。你也會發現，只要願意做一點點，"
        "永續其實沒有想像中那麼困難。"
    ),
    "10_org_feedback_question.wav": "我想這個組織也很致力在各個學校的角落努力宣導跟實踐他們的理念，你對於他們組織的行動有什麼感想嗎?或是能不能給他們一些鼓勵？",
    "11_self_identity_intro.wav": "接下來能不能請你再幫我做一個簡單的測驗？",
    "12_donation.wav": "最後一個問題是，如果你今天突然額外獲得100元的獎金，你願意從中將多少的獎金捐獻給這個機構來支持他們的行動?",
    "13_end.wav": "結束之前，我們有個連結中有最後部分的題目想請你幫忙回答。要記得填寫才算完成唷~再次感謝你的幫忙",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="/out")
    parser.add_argument("--sid", type=int, default=0)
    parser.add_argument("--speed", type=float, default=1.0)
    args = parser.parse_args()

    tts = _build_tts()
    out_dir = Path(args.out_dir)

    for filename, text in SCRIPTS.items():
        text = (text or "").strip()
        if not text:
            continue
        audio = tts.generate(text=text, sid=args.sid, speed=args.speed)
        out_path = out_dir / filename
        _write_wav(out_path, audio.samples, audio.sample_rate)
        print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
