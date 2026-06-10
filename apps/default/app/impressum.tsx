import { LegalScreen } from "../components/LegalScreen";
import { IMPRESSUM_TEXT } from "../lib/legal";

export default function Impressum() {
    return <LegalScreen title="Impressum" body={IMPRESSUM_TEXT} />;
}
