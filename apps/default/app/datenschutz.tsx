import { LegalScreen } from "../components/LegalScreen";
import { DATENSCHUTZ_TEXT } from "../lib/legal";

export default function Datenschutz() {
    return <LegalScreen title="Datenschutz" body={DATENSCHUTZ_TEXT} />;
}
